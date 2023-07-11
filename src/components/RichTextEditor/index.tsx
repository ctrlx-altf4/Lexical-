import { EditorState } from "lexical";
import { forwardRef, useEffect, useRef, useState } from "react";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import ImagesPlugin from "./plugins/ImagePlugin";
import nodes from "./nodes";
import { Maximize, Minimize } from "lucide-react";
import HtmlPlugin from "./plugins/HTMLPlugin";
const theme = {
  list: {
    listitem: "lexicalEditor__listItem",
    listitemChecked: "lexicalEditor__listItemChecked",
    listitemUnchecked: "lexicalEditor__listItemUnchecked",
    nested: {
      listitem: "lexicalEditor__nestedListItem",
    },
    olDepth: [
      "lexicalEditor__ol1",
      "lexicalEditor__ol2",
      "lexicalEditor__ol3",
      "lexicalEditor__ol4",
      "lexicalEditor__ol5",
    ],
    ul: "lexicalEditor__ul",
  },
  link: "lexicalEditor__link",
  heading: {
    h1: "lexicalEditor__h1",
    h2: "lexicalEditor__h2",
    h3: "lexicalEditor__h3",
    h4: "lexicalEditor__h4",
    h5: "lexicalEditor__h5",
    h6: "lexicalEditor__h6",
  },
  text: {
    bold: "font-bold",
    code: "lexicalEditor__textCode",
    italic: "lexicalEditor__textItalic",
    strikethrough: "text-decoration-line",
    superscript: "lexicalEditor__textSuperscript",
    underline: "underline",
    underlineStrikethrough: "lexicalEditor__textUnderlineStrikethrough",
  },
};

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: any) {
  console.error(error);
}

interface IRicthTextEditor {
  onChange?: (html: string) => void;
  value?: string;
}

function RichTextEditor({ onChange, value }: IRicthTextEditor) {
  const initialConfig = {
    namespace: "MyEditor",
    theme,
    onError,
    nodes: [...nodes],
  };

  const [isExpanded, setIsExpanded] = useState(false);

  const editorStateRef = useRef<EditorState | null>(null);
  return (
    <>
      <LexicalComposer initialConfig={initialConfig}>
        <div
          className="bg-white rounded-lg border shadow-md relative"
          style={{
            height: isExpanded ? "100vh" : "100%",
            width: isExpanded ? "100vw" : "100%",
            position: isExpanded ? "fixed" : "relative",
            top: 0,
            left: 0,
            zIndex: isExpanded ? 10 : 1,
          }}
        >
          <button
            type="button"
            className="absolute right-4 top-4"
            onClick={() => setIsExpanded((_c) => !_c)}
          >
            {isExpanded ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
          <ToolbarPlugin />
          <ImagesPlugin />
          <AutoFocusPlugin />
          <ListPlugin />
          <CheckListPlugin />
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="p-4 active:border-none outline-none min-h-[300px] leading-relaxed lexical-editor" />
            }
            placeholder={<div></div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HtmlPlugin
            onHtmlChanged={(html) => {
              onChange && onChange(html);
            }}
            initialHtml={value}
          />
          <LinkPlugin />

          <HistoryPlugin />
          {/* <MyCustomAutoFocusPlugin /> */}
        </div>
      </LexicalComposer>
    </>
  );
}

export default RichTextEditor;
