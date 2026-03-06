import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
  Unsubscribe,
} from 'firebase/firestore';
import { getFirestoreDb } from './firebaseConfig';
import { storage } from '../storage';
import { Prompt, PromptCategory } from '@/types';

export interface FirebasePrompt {
  id: string;
  text: string;
  title: string;
  category: string;
  tags: string[];
  source: 'chatgpt' | 'claude' | 'gemini' | 'midjourney';
  sourceUrl: string;
  created: Timestamp;
  updated: Timestamp;
}

class PromptSyncService {
  private unsubscribe: Unsubscribe | null = null;
  private processedIds = new Set<string>();
  private isInitialized = false;

  /**
   * Start listening for new prompts from Firebase
   */
  startSync(onNewPrompt?: (prompt: Prompt) => void): void {
    if (this.unsubscribe) {
      console.warn('⚠️ [FirebaseSync] Already syncing');
      return;
    }

    try {
      const db = getFirestoreDb();
      const promptsRef = collection(db, 'prompts');
      const q = query(
        promptsRef,
        orderBy('created', 'desc'),
        limit(50) // Listen to last 50 prompts
      );

      console.log('🔄 [FirebaseSync] Starting real-time sync...');

      this.unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const doc = change.doc;

              // Skip if we've already processed this prompt
              if (this.processedIds.has(doc.id)) {
                return;
              }

              // Skip initial load on first sync
              if (!this.isInitialized) {
                this.processedIds.add(doc.id);
                return;
              }

              const firebasePrompt = this.docToFirebasePrompt(doc);

              console.log(`🆕 [FirebaseSync] New prompt from ${firebasePrompt.source}:`, firebasePrompt.title);

              // Convert to local prompt format and save
              this.saveFirebasePromptToLocal(firebasePrompt).then((localPrompt) => {
                this.processedIds.add(doc.id);
                onNewPrompt?.(localPrompt);
              }).catch((err) => {
                console.error('❌ [FirebaseSync] Failed to save prompt:', err);
              });
            }
          });

          // Mark as initialized after first snapshot
          if (!this.isInitialized) {
            this.isInitialized = true;
            console.log('✅ [FirebaseSync] Sync initialized, listening for new prompts...');
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
      created: data.created,
      updated: data.updated,
    };
  }

  /**
   * Save Firebase prompt to local storage as .md file
   */
  private async saveFirebasePromptToLocal(firebasePrompt: FirebasePrompt): Promise<Prompt> {
    // Generate safe filename from title
    const safeTitle = firebasePrompt.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    const timestamp = Date.now();
    const filename = `${safeTitle}-${timestamp}.md`;

    // Map category to our PromptCategory type
    const category: PromptCategory = this.mapCategory(firebasePrompt.category);

    // Create frontmatter
    const frontmatter = `---
id: ${safeTitle}-${timestamp}
label: ${firebasePrompt.title}
category: ${category}
parent: master
tags: [${firebasePrompt.tags.join(', ')}]
source: ${firebasePrompt.source}
sourceUrl: ${firebasePrompt.sourceUrl}
created: ${firebasePrompt.created.toDate().toISOString()}
---

${firebasePrompt.text}`;

    // Save to disk
    await storage.savePrompt({
      id: `${safeTitle}-${timestamp}`,
      label: firebasePrompt.title,
      category,
      parent: 'master',
      content: frontmatter,
      bodyContent: firebasePrompt.text,
      filePath: filename,
    });

    console.log(`💾 [FirebaseSync] Saved: ${filename}`);

    // Return the prompt object
    return {
      id: `${safeTitle}-${timestamp}`,
      label: firebasePrompt.title,
      category,
      parent: 'master',
      content: frontmatter,
      bodyContent: firebasePrompt.text,
      filePath: filename,
    };
  }

  /**
   * Map Firebase category to our PromptCategory
   */
  private mapCategory(fbCategory: string): PromptCategory {
    const categoryMap: Record<string, PromptCategory> = {
      'technical': 'backend',
      'backend': 'backend',
      'api': 'backend',
      'design': 'design',
      'ui': 'design',
      'ux': 'design',
      'frontend': 'design',
      'marketing': 'marketing',
      'seo': 'marketing',
      'content': 'marketing',
      'core': 'core',
      'system': 'core',
    };

    const normalized = fbCategory.toLowerCase();
    return categoryMap[normalized] || 'other';
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
