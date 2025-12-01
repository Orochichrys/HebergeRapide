import React from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup'; // Import HTML language definition
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';

interface CodeEditorProps {
  code: string;
  language: 'html' | 'css' | 'js';
  onChange: (code: string) => void;
  placeholder?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, language, onChange, placeholder }) => {
  const highlight = (code: string) => {
    switch (language) {
      case 'css':
        return Prism.highlight(code, Prism.languages.css, 'css');
      case 'js':
        return Prism.highlight(code, Prism.languages.javascript, 'javascript');
      default:
        return Prism.highlight(code, Prism.languages.markup, 'markup');
    }
  };

  return (
    <div className="relative h-full font-mono text-sm bg-dark-bg border border-dark-border rounded-lg overflow-auto prism-editor focus-within:ring-2 focus-within:ring-brand-500 transition-shadow custom-scrollbar">
      <Editor
        value={code}
        onValueChange={onChange}
        highlight={highlight}
        padding={16}
        placeholder={placeholder}
        className="min-h-full text-foreground"
        style={{
          fontFamily: '"Fira Code", "Fira Mono", monospace',
          fontSize: 14,
          backgroundColor: '#0f172a',
        }}
        textareaClassName="focus:outline-none"
      />
      <div className="absolute top-2 right-2 text-[10px] text-muted-foreground bg-card px-2 py-1 rounded select-none pointer-events-none sticky float-right z-10">
        {language.toUpperCase()}
      </div>
    </div>
  );
};

export default CodeEditor;