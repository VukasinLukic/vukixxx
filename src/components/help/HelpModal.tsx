import React, { useState } from 'react';
import { X, BookOpen, Zap, Keyboard, HelpCircle, Info } from 'lucide-react';
import { helpSections, helpSectionKeys } from './helpContent';
import ReactMarkdown from 'react-markdown';
import './HelpModal.css';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: keyof typeof helpSections;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  gettingStarted: <BookOpen size={16} />,
  features: <Zap size={16} />,
  shortcuts: <Keyboard size={16} />,
  toonFormat: <Info size={16} />,
  faq: <HelpCircle size={16} />,
  credits: <Info size={16} />,
};

const SECTION_LABELS: Record<string, string> = {
  gettingStarted: 'Getting Started',
  features: 'Features',
  shortcuts: 'Shortcuts',
  toonFormat: 'TOON Format',
  faq: 'FAQ',
  credits: 'About',
};

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  initialSection = 'gettingStarted'
}) => {
  const [activeSection, setActiveSection] = useState<keyof typeof helpSections>(initialSection);

  if (!isOpen) return null;

  const currentSection = helpSections[activeSection];

  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="help-modal-header">
          <div className="help-modal-title">
            <BookOpen size={20} />
            <h2>Vukixxx Help</h2>
          </div>
          <button className="help-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="help-modal-body">
          {/* Sidebar Navigation */}
          <div className="help-modal-sidebar">
            {helpSectionKeys.map((key) => (
              <button
                key={key}
                className={`help-modal-nav-item ${activeSection === key ? 'active' : ''}`}
                onClick={() => setActiveSection(key)}
              >
                {SECTION_ICONS[key]}
                <span>{SECTION_LABELS[key]}</span>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="help-modal-content">
            <div className="help-modal-content-inner">
              <ReactMarkdown>{currentSection.content}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="help-modal-footer">
          <span className="help-modal-hint">
            Press <kbd>F1</kbd> anytime to open help
          </span>
          <button className="help-modal-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
