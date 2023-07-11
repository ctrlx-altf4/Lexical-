/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { LexicalEditor, NodeKey } from "lexical";

import {
  $createCodeNode,
  $isCodeNode,
  CODE_LANGUAGE_FRIENDLY_NAME_MAP,
  CODE_LANGUAGE_MAP,
  getLanguageFriendlyName,
} from "@lexical/code";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  $isListNode,
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { INSERT_EMBED_COMMAND } from "@lexical/react/LexicalAutoEmbedPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isDecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
  HeadingTagType,
} from "@lexical/rich-text";
import {
  $getSelectionStyleValueForProperty,
  $isParentElementRTL,
  $patchStyleText,
  $setBlocksType,
} from "@lexical/selection";
import { $isTableNode } from "@lexical/table";
import {
  $findMatchingParent,
  $getNearestBlockElementAncestorOrThrow,
  $getNearestNodeOfType,
  mergeRegister,
} from "@lexical/utils";
import {
  $createParagraphNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $isTextNode,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_NORMAL,
  DEPRECATED_$isGridSelection,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  KEY_MODIFIER_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import { useCallback, useEffect, useState } from "react";
import * as React from "react";
import { $generateHtmlFromNodes } from "@lexical/html";
// import {IS_APPLE} from 'shared/environment';

// import useModal from '../../hooks/useModal';
// import catTypingGif from "../../images/cat-typing.gif";
// import {$createStickyNode} from '../../nodes/StickyNode';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu";
// import DropdownColorPicker from '../../ui/DropdownColorPicker';
import { getSelectedNode } from "../utils/getSelectedNode";
import { sanitizeUrl } from "@/helpers/url";
// import {INSERT_COLLAPSIBLE_COMMAND} from '../CollapsiblePlugin';
import {
  INSERT_IMAGE_COMMAND,
  InsertImageDialog,
  InsertImagePayload,
} from "./ImagePlugin";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Italic,
  Link,
  List,
  ListOrdered,
  ListTodo,
  LucideIcon,
  Quote,
  RotateCcw,
  RotateCw,
  Strikethrough,
  Text,
  TextQuote,
  Underline,
} from "lucide-react";

// import {InsertNewTableDialog, InsertTableDialog} from '../TablePlugin';

const IS_APPLE = true;

const blockTypeToBlockName = {
  bullet: "Bulleted List",
  check: "Check List",
  code: "Code Block",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
  h5: "Heading 5",
  h6: "Heading 6",
  number: "Numbered List",
  paragraph: "Normal",
  quote: "Quote",
};

const blockTypeToBlockIcon: Record<
  keyof typeof blockTypeToBlockName,
  React.ReactNode
> = {
  bullet: <List size={16} />,
  check: <ListTodo size={16} />,
  code: <Code size={16} />,
  h1: <Heading1 size={16} />,
  h2: <Heading2 size={16} />,
  h3: <Heading3 size={16} />,
  h4: <Heading4 size={16} />,
  h5: <Heading5 size={16} />,
  h6: <Heading6 size={16} />,
  number: <ListOrdered size={16} />,
  paragraph: <Text size={16} />,
  quote: <Quote size={16} />,
};

const rootTypeToRootName = {
  root: "Root",
  table: "Table",
};

function getCodeLanguageOptions(): [string, string][] {
  const options: [string, string][] = [];

  for (const [lang, friendlyName] of Object.entries(
    CODE_LANGUAGE_FRIENDLY_NAME_MAP
  )) {
    options.push([lang, friendlyName]);
  }

  return options;
}

const CODE_LANGUAGE_OPTIONS = getCodeLanguageOptions();

const FONT_FAMILY_OPTIONS: [string, string][] = [
  ["Arial", "Arial"],
  ["Courier New", "Courier New"],
  ["Georgia", "Georgia"],
  ["Times New Roman", "Times New Roman"],
  ["Trebuchet MS", "Trebuchet MS"],
  ["Verdana", "Verdana"],
];

const FONT_SIZE_OPTIONS: [string, string][] = [
  ["10px", "10px"],
  ["11px", "11px"],
  ["12px", "12px"],
  ["13px", "13px"],
  ["14px", "14px"],
  ["15px", "15px"],
  ["16px", "16px"],
  ["17px", "17px"],
  ["18px", "18px"],
  ["19px", "19px"],
  ["20px", "20px"],
];

function dropDownActiveClass(active: boolean) {
  if (active) return "active dropdown-item-active";
  else return "";
}

function BlockFormatDropDown({
  editor,
  blockType,
  rootType,
  disabled = false,
}: {
  blockType: keyof typeof blockTypeToBlockName;
  rootType: keyof typeof rootTypeToRootName;
  editor: LexicalEditor;
  disabled?: boolean;
}): JSX.Element {
  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (
        $isRangeSelection(selection) ||
        DEPRECATED_$isGridSelection(selection)
      ) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const formatHeading = (headingSize: HeadingTagType) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if (
          $isRangeSelection(selection) ||
          DEPRECATED_$isGridSelection(selection)
        ) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize));
        }
      });
    }
  };

  const formatBulletList = () => {
    if (blockType !== "bullet") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatCheckList = () => {
    if (blockType !== "check") {
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== "number") {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatQuote = () => {
    if (blockType !== "quote") {
      editor.update(() => {
        const selection = $getSelection();
        if (
          $isRangeSelection(selection) ||
          DEPRECATED_$isGridSelection(selection)
        ) {
          $setBlocksType(selection, () => $createQuoteNode());
        }
      });
    }
  };

  const formatCode = () => {
    if (blockType !== "code") {
      editor.update(() => {
        let selection = $getSelection();

        if (
          $isRangeSelection(selection) ||
          DEPRECATED_$isGridSelection(selection)
        ) {
          if (selection.isCollapsed()) {
            $setBlocksType(selection, () => $createCodeNode());
          } else {
            const textContent = selection.getTextContent();
            const codeNode = $createCodeNode();
            selection.insertNodes([codeNode]);
            selection = $getSelection();
            if ($isRangeSelection(selection))
              selection.insertRawText(textContent);
          }
        }
      });
    }
  };

  return (
    <DropdownMenu

    //   className="toolbar-item block-controls"
    //   buttonIconClassName={"icon block-type " + blockType}
    >
      <DropdownMenuTrigger className="flex items-center gap-2">
        {blockTypeToBlockIcon[blockType]} {blockTypeToBlockName[blockType]}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          className={
            "item flex gap-2 " + dropDownActiveClass(blockType === "paragraph")
          }
          onClick={formatParagraph}
        >
          <Text size={16} />
          <span className="text">Normal</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={
            "item flex gap-2 " + dropDownActiveClass(blockType === "h1")
          }
          onClick={() => formatHeading("h1")}
        >
          <Heading1 size={16} />
          <span className="text">Heading 1</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={
            "item flex gap-2 " + dropDownActiveClass(blockType === "h2")
          }
          onClick={() => formatHeading("h2")}
        >
          <Heading2 size={16} />
          <span className="text">Heading 2</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={
            "item flex gap-2 " + dropDownActiveClass(blockType === "h3")
          }
          onClick={() => formatHeading("h3")}
        >
          <Heading3 size={16} />
          <span className="text">Heading 3</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={
            "item flex gap-2  " + dropDownActiveClass(blockType === "bullet")
          }
          onClick={formatBulletList}
        >
          <List size={16} />
          <span className="text">Bullet List</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={
            "item flex gap-2  " + dropDownActiveClass(blockType === "number")
          }
          onClick={formatNumberedList}
        >
          <ListOrdered size={16} />
          <span className="text">Numbered List</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={
            "item flex gap-2  " + dropDownActiveClass(blockType === "check")
          }
          onClick={formatCheckList}
        >
          <ListTodo size={16} />
          <span className="text">Check List</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={
            "item flex gap-2  " + dropDownActiveClass(blockType === "quote")
          }
          onClick={formatQuote}
        >
          <Quote size={16} />
          <span className="text">Quote</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={
            "item flex gap-2  " + dropDownActiveClass(blockType === "code")
          }
          onClick={formatCode}
        >
          <Code size={16} />
          <span className="text">Code Block</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Divider() {
  return <div className="w-[1px] bg-slate-200 mx-2" />;
}

function FontDropDown({
  editor,
  value,
  style,
  disabled = false,
}: {
  editor: LexicalEditor;
  value: string;
  style: string;
  disabled?: boolean;
}): JSX.Element {
  const handleClick = useCallback(
    (option: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, {
            [style]: option,
          });
        }
      });
    },
    [editor, style]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>{value}</DropdownMenuTrigger>
      <DropdownMenuContent>
        {(style === "font-family"
          ? FONT_FAMILY_OPTIONS
          : FONT_SIZE_OPTIONS
        ).map(([option, text]) => (
          <DropdownMenuItem
            className={`item ${dropDownActiveClass(value === option)} ${
              style === "font-size" ? "fontsize-item" : ""
            }`}
            onClick={() => handleClick(option)}
            key={option}
          >
            <span className="text">{text}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function ToolbarPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [blockType, setBlockType] =
    useState<keyof typeof blockTypeToBlockName>("paragraph");
  const [rootType, setRootType] =
    useState<keyof typeof rootTypeToRootName>("root");
  const [selectedElementKey, setSelectedElementKey] = useState<NodeKey | null>(
    null
  );
  const [fontSize, setFontSize] = useState<string>("15px");
  const [fontColor, setFontColor] = useState<string>("#000");
  const [bgColor, setBgColor] = useState<string>("#fff");
  const [fontFamily, setFontFamily] = useState<string>("Arial");
  const [isLink, setIsLink] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  //   const [modal, showModal] = useModal();
  const [isRTL, setIsRTL] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState<string>("");
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      let element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent();
              return parent !== null && $isRootOrShadowRoot(parent);
            });

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow();
      }

      const elementKey = element.getKey();
      const elementDOM = activeEditor.getElementByKey(elementKey);

      // Update text format
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsSubscript(selection.hasFormat("subscript"));
      setIsSuperscript(selection.hasFormat("superscript"));
      setIsCode(selection.hasFormat("code"));
      setIsRTL($isParentElementRTL(selection));

      // Update links
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }

      const tableNode = $findMatchingParent(node, $isTableNode);
      if ($isTableNode(tableNode)) {
        setRootType("table");
      } else {
        setRootType("root");
      }

      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(
            anchorNode,
            ListNode
          );
          const type = parentList
            ? parentList.getListType()
            : element.getListType();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          if (type in blockTypeToBlockName) {
            setBlockType(type as keyof typeof blockTypeToBlockName);
          }
          if ($isCodeNode(element)) {
            const language =
              element.getLanguage() as keyof typeof CODE_LANGUAGE_MAP;
            setCodeLanguage(
              language ? CODE_LANGUAGE_MAP[language] || language : ""
            );
            return;
          }
        }
      }
      // Handle buttons
      setFontSize(
        $getSelectionStyleValueForProperty(selection, "font-size", "15px")
      );
      setFontColor(
        $getSelectionStyleValueForProperty(selection, "color", "#000")
      );
      setBgColor(
        $getSelectionStyleValueForProperty(
          selection,
          "background-color",
          "#fff"
        )
      );
      setFontFamily(
        $getSelectionStyleValueForProperty(selection, "font-family", "Arial")
      );
    }
  }, [activeEditor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        $updateToolbar();
        setActiveEditor(newEditor);
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor, $updateToolbar]);

  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener((editable) => {
        setIsEditable(editable);
      }),
      activeEditor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      activeEditor.registerCommand<boolean>(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      activeEditor.registerCommand<boolean>(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );
  }, [$updateToolbar, activeEditor, editor]);

  useEffect(() => {
    return activeEditor.registerCommand(
      KEY_MODIFIER_COMMAND,
      (payload) => {
        const event: KeyboardEvent = payload;
        const { code, ctrlKey, metaKey } = event;

        if (code === "KeyK" && (ctrlKey || metaKey)) {
          event.preventDefault();
          return activeEditor.dispatchCommand(
            TOGGLE_LINK_COMMAND,
            sanitizeUrl("https://")
          );
        }
        return false;
      },
      COMMAND_PRIORITY_NORMAL
    );
  }, [activeEditor, isLink]);

  const applyStyleText = useCallback(
    (styles: Record<string, string>) => {
      activeEditor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, styles);
        }
      });
    },
    [activeEditor]
  );

  const clearFormatting = useCallback(() => {
    activeEditor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchor = selection.anchor;
        const focus = selection.focus;
        const nodes = selection.getNodes();

        if (anchor.key === focus.key && anchor.offset === focus.offset) {
          return;
        }

        nodes.forEach((node, idx) => {
          // We split the first and last node by the selection
          // So that we don't format unselected text inside those nodes
          if ($isTextNode(node)) {
            if (idx === 0 && anchor.offset !== 0) {
              node = node.splitText(anchor.offset)[1] || node;
            }
            if (idx === nodes.length - 1) {
              node = node.splitText(focus.offset)[0] || node;
            }

            if (node.__style !== "") {
              node.setStyle("");
            }
            if (node.__format !== 0) {
              node.setFormat(0);
              $getNearestBlockElementAncestorOrThrow(node).setFormat("");
            }
          } else if ($isHeadingNode(node) || $isQuoteNode(node)) {
            node.replace($createParagraphNode(), true);
          } else if ($isDecoratorBlockNode(node)) {
            node.setFormat("");
          }
        });
      }
    });
  }, [activeEditor]);

  const onFontColorSelect = useCallback(
    (value: string) => {
      applyStyleText({ color: value });
    },
    [applyStyleText]
  );

  const onBgColorSelect = useCallback(
    (value: string) => {
      applyStyleText({ "background-color": value });
    },
    [applyStyleText]
  );

  const insertLink = useCallback(() => {
    if (!isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl("https://"));
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, isLink]);

  const onCodeLanguageSelect = useCallback(
    (value: string) => {
      activeEditor.update(() => {
        if (selectedElementKey !== null) {
          const node = $getNodeByKey(selectedElementKey);
          if ($isCodeNode(node)) {
            node.setLanguage(value);
          }
        }
      });
    },
    [activeEditor, selectedElementKey]
  );
  const insertGifOnClick = (payload: InsertImagePayload) => {
    activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
  };

  return (
    <div className="toolbar  border-b py-4 px-2 flex gap-1">
      <button
        disabled={!canUndo || !isEditable}
        onClick={() => {
          activeEditor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
        title={IS_APPLE ? "Undo (⌘Z)" : "Undo (Ctrl+Z)"}
        type="button"
        className="toolbar-item spaced"
        aria-label="Undo"
      >
        <RotateCcw size={16} />
        <i className="format undo" />
      </button>
      <button
        disabled={!canRedo || !isEditable}
        onClick={() => {
          activeEditor.dispatchCommand(REDO_COMMAND, undefined);
        }}
        title={IS_APPLE ? "Redo (⌘Y)" : "Redo (Ctrl+Y)"}
        type="button"
        className="toolbar-item"
        aria-label="Redo"
      >
        <RotateCw size={16} />
      </button>
      <Divider />
      {blockType in blockTypeToBlockName && activeEditor === editor && (
        <>
          <BlockFormatDropDown
            disabled={!isEditable}
            blockType={blockType}
            rootType={rootType}
            editor={editor}
          />
          <Divider />
        </>
      )}
      {blockType === "code" ? (
        <DropdownMenu>
          <DropdownMenuTrigger>
            {getLanguageFriendlyName(codeLanguage)}
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {CODE_LANGUAGE_OPTIONS.map(([value, name]) => {
              return (
                <DropdownMenuItem
                  className={`item ${dropDownActiveClass(
                    value === codeLanguage
                  )}`}
                  onClick={() => onCodeLanguageSelect(value)}
                  key={value}
                >
                  <span className="text">{name}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <>
          {/* <FontDropDown
            disabled={!isEditable}
            style={"font-family"}
            value={fontFamily}
            editor={editor}
          />
          <FontDropDown
            disabled={!isEditable}
            style={"font-size"}
            value={fontSize}
            editor={editor}
          /> */}
          {/* <Divider /> */}
          <button
            disabled={!isEditable}
            onClick={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
            }}
            className={"toolbar-item spaced " + (isBold ? "bg-stone-100" : "")}
            title={IS_APPLE ? "Bold (⌘B)" : "Bold (Ctrl+B)"}
            type="button"
            aria-label={`Format text as bold. Shortcut: ${
              IS_APPLE ? "⌘B" : "Ctrl+B"
            }`}
          >
            <Bold size={16} strokeWidth={3} />
          </button>
          <button
            disabled={!isEditable}
            onClick={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
            }}
            className={
              "toolbar-item spaced " + (isItalic ? "bg-stone-100" : "")
            }
            title={IS_APPLE ? "Italic (⌘I)" : "Italic (Ctrl+I)"}
            type="button"
            aria-label={`Format text as italics. Shortcut: ${
              IS_APPLE ? "⌘I" : "Ctrl+I"
            }`}
          >
            <Italic size={16} />
          </button>
          <button
            disabled={!isEditable}
            onClick={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
            }}
            className={
              "toolbar-item spaced " + (isUnderline ? "bg-stone-100" : "")
            }
            title={IS_APPLE ? "Underline (⌘U)" : "Underline (Ctrl+U)"}
            type="button"
            aria-label={`Format text to underlined. Shortcut: ${
              IS_APPLE ? "⌘U" : "Ctrl+U"
            }`}
          >
            <Underline size={16} />
          </button>
          <button
            disabled={!isEditable}
            onClick={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
            }}
            className={"toolbar-item spaced " + (isCode ? "bg-stone-100" : "")}
            title="Insert code block"
            type="button"
            aria-label="Insert code block"
          >
            <Code size={16} />
          </button>
          <button
            disabled={!isEditable}
            onClick={insertLink}
            className={"toolbar-item spaced " + (isLink ? "bg-stone-100" : "")}
            aria-label="Insert link"
            title="Insert link"
            type="button"
          >
            <Link size={16} />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger>Str</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => {
                  activeEditor.dispatchCommand(
                    FORMAT_TEXT_COMMAND,
                    "strikethrough"
                  );
                }}
                className={"item " + dropDownActiveClass(isStrikethrough)}
                title="Strikethrough"
                aria-label="Format text with a strikethrough"
              >
                <Strikethrough size={16} />
                <span className="text">Strikethrough</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  activeEditor.dispatchCommand(
                    FORMAT_TEXT_COMMAND,
                    "subscript"
                  );
                }}
                className={"item " + dropDownActiveClass(isSubscript)}
                title="Subscript"
                aria-label="Format text with a subscript"
              >
                <i className="icon subscript" />
                <span className="text">Subscript</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  activeEditor.dispatchCommand(
                    FORMAT_TEXT_COMMAND,
                    "superscript"
                  );
                }}
                className={"item " + dropDownActiveClass(isSuperscript)}
                title="Superscript"
                aria-label="Format text with a superscript"
              >
                <i className="icon superscript" />
                <span className="text">Superscript</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={clearFormatting}
                className="item"
                title="Clear text formatting"
                aria-label="Clear all text formatting"
              >
                <i className="icon clear" />
                <span className="text">Clear Formatting</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Divider />

          {/* <DropdownMenu>
            <DropdownMenuTrigger>Insert</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => {
                  activeEditor.dispatchCommand(
                    INSERT_HORIZONTAL_RULE_COMMAND,
                    undefined
                  );
                }}
                className="item"
              >
                <i className="icon horizontal-rule" />
                <span className="text">Horizontal Rule</span>
              </DropdownMenuItem>
              <DropDownItem
              onClick={() => {
                showModal('Insert Image', (onClose) => (
                  <InsertImageDialog
                    activeEditor={activeEditor}
                    onClose={onClose}
                  />
                ));
              }}
              className="item">
              <i className="icon image" />
              <span className="text">Image</span>
            </DropDownItem>

              <DropdownMenuItem
              onClick={() =>
                insertGifOnClick({
                  altText: "Cat typing on a laptop",
                  src: catTypingGif,
                })
              }
              className="item"
            >
              <i className="icon gif" />
              <span className="text">GIF</span>
            </DropdownMenuItem>

              <DropdownMenuItem
              onClick={() => {
                editor.update(() => {
                  const root = $getRoot();
                  const stickyNode = $createStickyNode(0, 0);
                  root.append(stickyNode);
                });
              }}
              className="item">
              <i className="icon sticky" />
              <span className="text">Sticky Note</span>
            </DropdownMenuItem>
              <DropdownMenuItem
              onClick={() => {
                editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined);
              }}
              className="item">
              <i className="icon caret-right" />
              <span className="text">Collapsible container</span>
            </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}
        </>
      )}
      <InsertImageDialog activeEditor={editor} />
      <Divider />
      <DropdownMenu>
        <DropdownMenuTrigger>Align</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => {
              activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
            }}
            className="item"
          >
            <AlignLeft size={16} />
            <span className="text">Left Align</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
            }}
            className="item"
          >
            <AlignCenter size={16} />
            <span className="text">Center Align</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
            }}
            className="item"
          >
            <AlignRight size={16} />
            <span className="text">Right Align</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify");
            }}
            className="item"
          >
            <AlignJustify size={16} />
            <span className="text">Justify Align</span>
          </DropdownMenuItem>
          {/* <Divider />
          <DropdownMenuItem
            onClick={() => {
              activeEditor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
            }}
            className="item"
          >
            <i className={"icon " + (isRTL ? "indent" : "outdent")} />
            <span className="text">Outdent</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              activeEditor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
            }}
            className="item"
          >
            <i className={"icon " + (isRTL ? "outdent" : "indent")} />
            <span className="text">Indent</span>
          </DropdownMenuItem>
        </DropdownMenuContent> */}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
