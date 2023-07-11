import type { Klass, LexicalNode } from "lexical";
import { ImageNode } from "./ImageNode";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
const AllNodes: Array<Klass<LexicalNode>> = [
  ImageNode,
  LinkNode,
  AutoLinkNode,
  HeadingNode,
  QuoteNode,
  ListItemNode,
  ListNode,
  HorizontalRuleNode,
  CodeHighlightNode,
  CodeNode,
];

export default AllNodes;
