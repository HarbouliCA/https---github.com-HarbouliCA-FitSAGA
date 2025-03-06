'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Heading from '@tiptap/extension-heading';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { useState, useEffect } from 'react';
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  List as ListIcon,
  ListOrdered as ListOrderedIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Link as LinkIcon,
  Table as TableIcon,
  Highlighter,
  Type,
  Palette,
  Eye,
} from 'lucide-react';

// Use a simpler approach for font size
const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: element => element.style.fontSize,
        renderHTML: attributes => {
          if (!attributes.fontSize) {
            return {};
          }
          return {
            style: `font-size: ${attributes.fontSize}`,
          };
        },
      },
    };
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
}

const fontFamilies = [
  { name: 'Default', value: '' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, sans-serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Courier New', value: 'Courier New, monospace' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
];

const fontSizes = [
  { name: 'Default', value: '' },
  { name: '10px', value: '10px' },
  { name: '11px', value: '11px' },
  { name: '12px', value: '12px' },
  { name: '14px', value: '14px' },
  { name: '16px', value: '16px' },
  { name: '18px', value: '18px' },
  { name: '20px', value: '20px' },
  { name: '22px', value: '22px' },
  { name: '24px', value: '24px' },
  { name: '26px', value: '26px' },
  { name: '28px', value: '28px' },
  { name: '36px', value: '36px' },
  { name: '48px', value: '48px' },
  { name: '72px', value: '72px' },
];

const colors = [
  { name: 'Black', value: '#000000' },
  { name: 'Gray', value: '#666666' },
  { name: 'Red', value: '#ff0000' },
  { name: 'Orange', value: '#ff9900' },
  { name: 'Yellow', value: '#ffff00' },
  { name: 'Green', value: '#00ff00' },
  { name: 'Blue', value: '#0000ff' },
  { name: 'Purple', value: '#9900ff' },
];

export default function RichTextEditor({ content, onChange, className = '' }: RichTextEditorProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontFamily, setShowFontFamily] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      BulletList,
      OrderedList,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Bold,
      Italic,
      Underline,
      Image,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary-600 underline',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      setPreviewContent(html);
    },
  });

  useEffect(() => {
    if (editor && content) {
      setPreviewContent(content);
    }
  }, [editor, content]);

  if (!editor) {
    return null;
  }

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().insertContent(`<img src="${imageUrl}" alt="image" />`).run();
      setImageUrl('');
      setShowImageInput(false);
    }
  };

  const toggleImageInput = () => {
    setShowImageInput(!showImageInput);
    if (!showImageInput) {
      setImageUrl('');
    }
  };

  const addLink = () => {
    if (linkUrl) {
      // Check if text is selected
      if (editor.state.selection.empty) {
        editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkUrl}</a>`).run();
      } else {
        editor.chain().focus().setLink({ href: linkUrl }).run();
      }
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  const toggleLinkInput = () => {
    setShowLinkInput(!showLinkInput);
    if (!showLinkInput) {
      setLinkUrl('');
    }
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const setFontFamily = (fontFamily: string) => {
    editor.chain().focus().setFontFamily(fontFamily).run();
    setShowFontFamily(false);
  };

  const setFontSize = (fontSize: string) => {
    // Use TextStyle to set fontSize attribute
    editor.chain().focus().setMark('textStyle', { fontSize }).run();
    setShowFontSize(false);
  };

  const setColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
    setShowColorPicker(false);
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <div className={`border rounded-md ${className}`}>
      <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`editor-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
          title="Bold"
        >
          <BoldIcon size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`editor-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
          title="Italic"
        >
          <ItalicIcon size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`editor-btn ${editor.isActive('underline') ? 'is-active' : ''}`}
          title="Underline"
        >
          <UnderlineIcon size={18} />
        </button>

        <div className="h-6 w-px bg-gray-300 mx-1"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`editor-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
          title="Heading 1"
        >
          <Heading1 size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`editor-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
          title="Heading 2"
        >
          <Heading2 size={18} />
        </button>

        <div className="h-6 w-px bg-gray-300 mx-1"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`editor-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
          title="Bullet List"
        >
          <ListIcon size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`editor-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
          title="Ordered List"
        >
          <ListOrderedIcon size={18} />
        </button>

        <div className="h-6 w-px bg-gray-300 mx-1"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`editor-btn ${editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}`}
          title="Align Left"
        >
          <AlignLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`editor-btn ${editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}`}
          title="Align Center"
        >
          <AlignCenter size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`editor-btn ${editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}`}
          title="Align Right"
        >
          <AlignRight size={18} />
        </button>

        <div className="h-6 w-px bg-gray-300 mx-1"></div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowFontFamily(!showFontFamily)}
            className="editor-btn flex items-center gap-1"
            title="Font Family"
          >
            <Type size={18} />
            <span className="text-xs">Font</span>
          </button>
          {showFontFamily && (
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-10 w-48">
              {fontFamilies.map((font) => (
                <button
                  key={font.name}
                  type="button"
                  onClick={() => setFontFamily(font.value)}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  style={{ fontFamily: font.value || 'inherit' }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowFontSize(!showFontSize)}
            className="editor-btn flex items-center gap-1"
            title="Font Size"
          >
            <Type size={18} />
            <span className="text-xs">Size</span>
          </button>
          {showFontSize && (
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-10 w-24 max-h-60 overflow-y-auto">
              {fontSizes.map((size) => (
                <button
                  key={size.name}
                  type="button"
                  onClick={() => setFontSize(size.value)}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  style={{ fontSize: size.value || 'inherit' }}
                >
                  {size.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="editor-btn"
            title="Text Color"
          >
            <Palette size={18} />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-10 w-48 p-2">
              <div className="grid grid-cols-4 gap-2">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setColor(color.value)}
                    className="w-8 h-8 rounded-full border"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  ></button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`editor-btn ${editor.isActive('highlight') ? 'is-active' : ''}`}
          title="Highlight"
        >
          <Highlighter size={18} />
        </button>

        <div className="h-6 w-px bg-gray-300 mx-1"></div>

        <div className="relative">
          <button
            type="button"
            onClick={toggleImageInput}
            className={`editor-btn ${showImageInput ? 'is-active' : ''}`}
            title="Insert Image"
          >
            <ImageIcon size={18} />
          </button>
          {showImageInput && (
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-10 w-64 p-2">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Enter image URL"
                className="w-full p-2 border rounded mb-2"
              />
              <button
                type="button"
                onClick={addImage}
                className="bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700"
              >
                Insert
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={toggleLinkInput}
            className={`editor-btn ${showLinkInput ? 'is-active' : ''}`}
            title="Insert Link"
          >
            <LinkIcon size={18} />
          </button>
          {showLinkInput && (
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-10 w-64 p-2">
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="Enter URL"
                className="w-full p-2 border rounded mb-2"
              />
              <button
                type="button"
                onClick={addLink}
                className="bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700"
              >
                Insert
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={insertTable}
          className="editor-btn"
          title="Insert Table"
        >
          <TableIcon size={18} />
        </button>

        <div className="h-6 w-px bg-gray-300 mx-1"></div>

        <button
          type="button"
          onClick={togglePreview}
          className={`editor-btn ${showPreview ? 'is-active' : ''}`}
          title="Preview"
        >
          <Eye size={18} />
        </button>
      </div>

      {showPreview ? (
        <div className="p-4 min-h-[200px] max-h-[500px] overflow-auto">
          <div className="preview-content" dangerouslySetInnerHTML={{ __html: previewContent }}></div>
        </div>
      ) : (
        <EditorContent editor={editor} className="p-4 min-h-[200px] max-h-[500px] overflow-auto" />
      )}
    </div>
  );
}
