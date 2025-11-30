import React from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup'; // Import HTML language definition
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  placeholder?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, placeholder }) => {
  const highlight = (code: string) => {
    return Prism.highlight(code, Prism.languages.markup, 'markup'); // 'markup' handles HTML
  };

  return (
    <div className="relative font-mono text-sm bg-dark-bg border border-dark-border rounded-lg overflow-hidden prism-editor focus-within:ring-2 focus-within:ring-brand-500 transition-shadow">
      <Editor
        value={code}
        onValueChange={onChange}
        highlight={highlight}
        padding={16}
        placeholder={placeholder}
        className="min-h-[300px] text-foreground"
        style={{
          fontFamily: '"Fira Code", "Fira Mono", monospace',
          fontSize: 14,
          backgroundColor: '#0f172a',
        }}
        textareaClassName="focus:outline-none"
      />
      <div className="absolute top-2 right-2 text-[10px] text-muted-foreground bg-card px-2 py-1 rounded select-none pointer-events-none">
        HTML
      </div>
    </div>
  );
};

export default CodeEditor;