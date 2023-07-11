import { useEffect } from "react";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { $getRoot, $insertNodes } from "lexical";

interface Props {
  initialHtml?: string;
  onHtmlChanged: (html: string) => void;
}

const HtmlPlugin = ({ initialHtml, onHtmlChanged }: Props) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (initialHtml) {
      editor.update(() => {
        // Had to remove the content before inserting to nodes
        // because this update was running twice and the html was being rendered double
        $getRoot()
          .getChildren()
          .forEach((n) => n.remove());
        const parser = new DOMParser();
        const dom = parser.parseFromString(initialHtml, "text/html");
        const nodes = $generateNodesFromDOM(editor, dom);
        $insertNodes(nodes);
      });
    }
  }, [editor, initialHtml]);

  return (
    <OnChangePlugin
      onChange={(editorState) => {
        editorState.read(() => {
          onHtmlChanged($generateHtmlFromNodes(editor));
        });
      }}
    />
  );
};

export default HtmlPlugin;
