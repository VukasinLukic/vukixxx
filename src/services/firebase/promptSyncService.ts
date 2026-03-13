import {
  collection,
  query,
  orderBy,
  limit,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
  Unsubscribe,
} from 'firebase/firestore';
import { getFirestoreDb } from './firebaseConfig';
import { createStorageAdapter } from '@/services/storage/createAdapter';
import { classifyPrompt, generatePromptTitle } from '@/services/ai/classificationService';
import { Prompt, PromptCategory } from '@/types';

const storage = createStorageAdapter();

export interface FirebasePrompt {
  id: string;
  text: string;
  title: string;
  category: string;
  tags: string[];
  source: 'chatgpt' | 'claude' | 'gemini' | 'midjourney';
  sourceUrl: string;
  classified: boolean;
  confidence: number;
  created: Timestamp;
  updated: Timestamp;
}

class PromptSyncService {
  private unsubscribe: Unsubscribe | null = null;
  private processedIds = new Set<string>();
  private localPromptIds = new Set<string>();
  private isInitialized = false;
  private classificationQueue: { docId: string; prompt: FirebasePrompt }[] = [];
  private isClassifying = false;

  /**
   * Load existing local prompt IDs to prevent duplicates across restarts
   */
  private async loadLocalPromptIds(): Promise<void> {
    try {
      const localPrompts = await storage.loadAllPrompts();
      for (const p of localPrompts) {
        this.localPromptIds.add(p.id);
      }
      console.log(`📋 [FirebaseSync] Found ${this.localPromptIds.size} existing local prompts`);
    } catch (err) {
      console.warn('⚠️ [FirebaseSync] Failed to load local prompt IDs:', err);
    }
  }

  /**
   * Start listening for new prompts from Firebase
   */
  async startSync(onNewPrompt?: (prompt: Prompt) => void): Promise<void> {
    if (this.unsubscribe) {
      console.warn('⚠️ [FirebaseSync] Already syncing');
      return;
    }

    // Load existing local prompts to detect duplicates
    await this.loadLocalPromptIds();

    try {
      const db = getFirestoreDb();
      const promptsRef = collection(db, 'prompts');
      const q = query(
        promptsRef,
        orderBy('created', 'desc'),
        limit(50)
      );

      console.log('🔄 [FirebaseSync] Starting real-time sync...');

      this.unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const docRef = change.doc;
              const localId = `fb-${docRef.id}`;

              // Skip if already processed this session
              if (this.processedIds.has(docRef.id)) {
                return;
              }

              // Skip if already saved locally (from previous sessions)
              if (this.localPromptIds.has(localId)) {
                this.processedIds.add(docRef.id);
                if (!this.isInitialized) {
                  console.log(`⏭️ [FirebaseSync] Already saved locally, skipping: ${docRef.id}`);
                }
                return;
              }

              const firebasePrompt = this.docToFirebasePrompt(docRef);

              if (!this.isInitialized) {
                console.log(`📥 [FirebaseSync] Loading existing prompt: ${firebasePrompt.title}`);
              } else {
                console.log(`🆕 [FirebaseSync] New prompt from ${firebasePrompt.source}:`, firebasePrompt.title);
              }

              // If not classified, queue for AI classification
              if (!firebasePrompt.classified) {
                console.log(`🤖 [FirebaseSync] Queuing for AI classification: ${firebasePrompt.title || '(no title)'}`);
                this.classificationQueue.push({ docId: docRef.id, prompt: firebasePrompt });
                this.processClassificationQueue(onNewPrompt);
              } else {
                // Already classified — save directly
                this.saveFirebasePromptToLocal(firebasePrompt).then((localPrompt) => {
                  this.processedIds.add(docRef.id);
                  this.localPromptIds.add(localPrompt.id);
                  onNewPrompt?.(localPrompt);
                }).catch((err) => {
                  console.error('❌ [FirebaseSync] Failed to save prompt:', err);
                });
              }
            }
          });

          // Mark as initialized after first snapshot
          if (!this.isInitialized) {
            this.isInitialized = true;
            const count = snapshot.docChanges().filter(c => c.type === 'added').length;
            const skipped = snapshot.docChanges().filter(c =>
              c.type === 'added' && this.localPromptIds.has(`fb-${c.doc.id}`)
            ).length;
            console.log(`✅ [FirebaseSync] Sync initialized. ${count} Firebase prompts, ${skipped} already local, ${count - skipped} new.`);
          }
        },
        (error) => {
          console.error('❌ [FirebaseSync] Error in snapshot listener:', error);
        }
      );
    } catch (error) {
      console.error('❌ [FirebaseSync] Failed to start sync:', error);
    }
  }

  /**
   * Process the classification queue sequentially to avoid rate limits
   */
  private async processClassificationQueue(onNewPrompt?: (prompt: Prompt) => void): Promise<void> {
    if (this.isClassifying) return; // Already processing
    this.isClassifying = true;

    while (this.classificationQueue.length > 0) {
      const item = this.classificationQueue.shift()!;
      try {
        await this.classifyAndSave(item.docId, item.prompt, onNewPrompt);
      } catch (err) {
        console.error(`❌ [FirebaseSync] Classification failed for ${item.prompt.title}:`, err);
        // Save with 'other' category as fallback
        item.prompt.category = 'other';
        try {
          const localPrompt = await this.saveFirebasePromptToLocal(item.prompt);
          this.processedIds.add(item.docId);
          this.localPromptIds.add(localPrompt.id);
          onNewPrompt?.(localPrompt);
        } catch (saveErr) {
          console.error('❌ [FirebaseSync] Fallback save also failed:', saveErr);
        }
      }
    }

    this.isClassifying = false;
  }

  /**
   * Classify a prompt using AI and write results back to Firebase
   */
  private async classifyAndSave(
    docId: string,
    firebasePrompt: FirebasePrompt,
    onNewPrompt?: (prompt: Prompt) => void,
  ): Promise<void> {
    console.log(`🤖 [FirebaseSync] Classifying: "${firebasePrompt.title || '(no title)'}"...`);

    // Run AI classification
    const classification = await classifyPrompt(firebasePrompt.text);

    // Generate title if missing or generic
    let title = firebasePrompt.title;
    if (!title || title === 'Untitled Prompt' || title.trim() === '') {
      title = await generatePromptTitle(firebasePrompt.text);
      console.log(`📝 [FirebaseSync] Generated title: "${title}"`);
    }

    console.log(`✅ [FirebaseSync] Classified as: ${classification.category}, tags: [${classification.tags.join(', ')}], confidence: ${classification.confidence}`);

    // Write classification results back to Firebase
    try {
      const db = getFirestoreDb();
      const promptRef = doc(db, 'prompts', docId);
      await updateDoc(promptRef, {
        category: classification.category,
        tags: classification.tags,
        title: title,
        classified: true,
        confidence: classification.confidence,
        updated: Timestamp.now(),
      });
      console.log(`🔥 [FirebaseSync] Updated Firebase with classification for: ${title}`);
    } catch (err) {
      console.warn('⚠️ [FirebaseSync] Failed to write classification back to Firebase:', err);
      // Continue anyway — save locally with classified data
    }

    // Update prompt data with classification results
    firebasePrompt.category = classification.category;
    firebasePrompt.tags = classification.tags;
    firebasePrompt.title = title;
    firebasePrompt.confidence = classification.confidence;
    firebasePrompt.classified = true;

    // Save locally
    const localPrompt = await this.saveFirebasePromptToLocal(firebasePrompt);
    this.processedIds.add(docId);
    this.localPromptIds.add(localPrompt.id);
    onNewPrompt?.(localPrompt);
  }

  /**
   * Batch classify all unclassified prompts in Firebase.
   * Call this manually to classify existing prompts that were saved before
   * the lazy classification was implemented.
   */
  async classifyUnclassifiedPrompts(onProgress?: (current: number, total: number) => void): Promise<number> {
    console.log('🔄 [FirebaseSync] Starting batch classification of unclassified prompts...');

    const db = getFirestoreDb();
    const promptsRef = collection(db, 'prompts');
    const q = query(promptsRef, where('classified', '==', false));

    const snapshot = await getDocs(q);
    const total = snapshot.size;

    if (total === 0) {
      console.log('✅ [FirebaseSync] No unclassified prompts found');
      return 0;
    }

    console.log(`📋 [FirebaseSync] Found ${total} unclassified prompts, classifying...`);
    let classified = 0;

    for (const docSnapshot of snapshot.docs) {
      const firebasePrompt = this.docToFirebasePrompt(docSnapshot);
      try {
        await this.classifyAndSave(docSnapshot.id, firebasePrompt);
        classified++;
        onProgress?.(classified, total);
      } catch (err) {
        console.error(`❌ [FirebaseSync] Failed to classify: ${firebasePrompt.title}`, err);
      }
    }

    console.log(`✅ [FirebaseSync] Batch classification complete: ${classified}/${total} classified`);
    return classified;
  }

  /**
   * Stop listening for new prompts
   */
  stopSync(): void {
    if (this.unsubscribe) {
      console.log('⏹️ [FirebaseSync] Stopping sync...');
      this.unsubscribe();
      this.unsubscribe = null;
      this.isInitialized = false;
    }
  }

  /**
   * Convert Firestore document to FirebasePrompt
   */
  private docToFirebasePrompt(doc: QueryDocumentSnapshot<DocumentData>): FirebasePrompt {
    const data = doc.data();
    return {
      id: doc.id,
      text: data.text || '',
      title: data.title || 'Untitled Prompt',
      category: data.category || 'other',
      tags: data.tags || [],
      source: data.source || 'chatgpt',
      sourceUrl: data.sourceUrl || '',
      classified: data.classified === true, // Default to false if missing
      confidence: data.confidence || 0,
      created: data.created,
      updated: data.updated,
    };
  }

  /**
   * Save Firebase prompt to local storage as .md file
   */
  private async saveFirebasePromptToLocal(firebasePrompt: FirebasePrompt): Promise<Prompt> {
    // Use Firebase document ID as stable local ID (prevents duplicates across restarts)
    const localId = `fb-${firebasePrompt.id}`;

    // Map category to our PromptCategory type
    const category: PromptCategory = this.mapCategory(firebasePrompt.category);

    const createdDate = firebasePrompt.created?.toDate?.().toISOString() || new Date().toISOString();
    const updatedDate = firebasePrompt.updated?.toDate?.().toISOString() || new Date().toISOString();
    const tags = firebasePrompt.tags || [];
    const tagsString = tags.length > 0 ? tags.join(', ') : '';

    // Create frontmatter
    const frontmatter = `---
id: ${localId}
label: ${firebasePrompt.title}
category: ${category}
parent: master
tags: [${tagsString}]
source: ${firebasePrompt.source}
sourceUrl: ${firebasePrompt.sourceUrl}
classified: ${firebasePrompt.classified}
confidence: ${firebasePrompt.confidence}
created: ${createdDate}
updated: ${updatedDate}
---

${firebasePrompt.text}`;

    // Create the prompt object with all required fields
    const prompt: Prompt = {
      id: localId,
      label: firebasePrompt.title,
      category,
      parent: 'master',
      type: 'prompt',
      tags,
      content: frontmatter,
      bodyContent: firebasePrompt.text,
      createdAt: createdDate,
      updatedAt: updatedDate,
    };

    // Save to disk (overwrites if same ID already exists)
    await storage.savePrompt(prompt);

    console.log(`💾 [FirebaseSync] Saved: ${localId}.md`);

    return prompt;
  }

  /**
   * Map Firebase category to our PromptCategory
   */
  private mapCategory(fbCategory: string): PromptCategory {
    const categoryMap: Record<string, PromptCategory> = {
      // Core
      'core': 'core',
      'system': 'core',
      'meta': 'core',
      'agent': 'core',
      // Coding
      'coding': 'coding',
      'programming': 'coding',
      'code': 'coding',
      'code-review': 'coding',
      'debugging': 'coding',
      'algorithm': 'coding',
      'testing': 'coding',
      // Frontend
      'frontend': 'frontend',
      'react': 'frontend',
      'css': 'frontend',
      'html': 'frontend',
      'ui': 'frontend',
      'ux': 'frontend',
      'web': 'frontend',
      'mobile': 'frontend',
      // Backend
      'backend': 'backend',
      'api': 'backend',
      'server': 'backend',
      'database': 'backend',
      'devops': 'backend',
      'infrastructure': 'backend',
      'technical': 'backend',
      // Design
      'design': 'design',
      'wireframe': 'design',
      'figma': 'design',
      'prototype': 'design',
      // Writing
      'writing': 'writing',
      'copywriting': 'writing',
      'content': 'writing',
      'blog': 'writing',
      'documentation': 'writing',
      'editing': 'writing',
      // Marketing
      'marketing': 'marketing',
      'seo': 'marketing',
      'ads': 'marketing',
      'social': 'marketing',
      'growth': 'marketing',
      // Data
      'data': 'data',
      'analytics': 'data',
      'ml': 'data',
      'machine-learning': 'data',
      'statistics': 'data',
      'sql': 'data',
      // Business
      'business': 'business',
      'strategy': 'business',
      'planning': 'business',
      'management': 'business',
      'finance': 'business',
      'product': 'business',
      // Creative
      'creative': 'creative',
      'art': 'creative',
      'brainstorming': 'creative',
      'storytelling': 'creative',
      'image': 'creative',
      'midjourney': 'creative',
    };

    const normalized = fbCategory.toLowerCase().trim();
    const mapped = categoryMap[normalized];
    if (!mapped) {
      console.warn(`⚠️ [FirebaseSync] Unknown category "${fbCategory}" → defaulting to "other"`);
    }
    return mapped || 'other';
  }

  /**
   * Get sync status
   */
  isActive(): boolean {
    return this.unsubscribe !== null;
  }
}

// Export singleton instance
export const promptSyncService = new PromptSyncService();
