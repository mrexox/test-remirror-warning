import React, { useCallback } from 'react';

import { cx } from '@remirror/core'
import { FloatingWrapper } from '@remirror/react'
import { useEmoji } from '@remirror/react-hooks'
import { ExtensionEmojiTheme } from '@remirror/theme'

import {
  BoldExtension,
  ItalicExtension,
  LinkExtension,
  BlockquoteExtension,
  MarkdownExtension,
  HeadingExtension,
  EmojiExtension,
} from 'remirror/extensions'
import {
  EditorComponent,
  Remirror,
  ThemeProvider,
  useRemirror,
} from '@remirror/react'
import { AllStyledComponent } from '@remirror/styles/emotion'

import './App.css';

import data from 'svgmoji/emoji-github.min.json'

function App() {
    const extensions = useCallback(
    () => [
      new BoldExtension(),
      new ItalicExtension(),
      new BlockquoteExtension(),
      new HeadingExtension(),
      new LinkExtension({ autoLink: true, defaultTarget: '_blank' }),
      new MarkdownExtension(),
      new EmojiExtension({
        plainText: true,
        data,
        moji: 'twemoji',
        fallback: 'question',
      }),
    ],
    []
  );
  const { manager, state } = useRemirror({
    extensions,
    selection: 'start',
    stringHandler: 'html',
  });


  return (
    <div className="App">
      <AllStyledComponent>
        <ThemeProvider>
          <Remirror
            manager={manager}
            initialContent={state}
            autoFocus={true}
          >
            <EmojiPopup />
            <EditorComponent />
          </Remirror>
        </ThemeProvider>
      </AllStyledComponent>

    </div>
  );
}

/**
 * This component renders the emoji suggestion dropdown for the user.
 *
 * This is an overwrite of EmojiPopupComponent. This was needed because
 * original component renders emojis as SVG which adds extra network load
 * with a little displaying lag. Using plain `emoji` value is more performant.
 *
 * @see https://github.com/remirror/remirror/blob/main/packages/remirror__react-components/src/popups/emoji-popup-component.tsx
 */
function EmojiPopup() {
  const {
    state,
    getMenuProps,
    getItemProps,
    indexIsHovered,
    indexIsSelected,
  } = useEmoji()
  const enabled = !!state

  return (
    <FloatingWrapper
      positioner="cursor"
      enabled={enabled}
      placement="auto-end"
      renderOutsideEditor
    >
      <div
        {...getMenuProps()}
        className={cx(ExtensionEmojiTheme.EMOJI_POPUP_WRAPPER)}
      >
        {enabled &&
          (state?.list ?? []).map((emoji, index) => {
            const isHighlighted = indexIsSelected(index)
            const isHovered = indexIsHovered(index)
            const shortcode = emoji.shortcodes?.[0] ?? emoji.annotation

            return (
              <div
                key={emoji.emoji}
                className={cx(
                  ExtensionEmojiTheme.EMOJI_POPUP_ITEM,
                  isHighlighted && ExtensionEmojiTheme.EMOJI_POPUP_HIGHLIGHT,
                  isHovered && ExtensionEmojiTheme.EMOJI_POPUP_HOVERED
                )}
                {...getItemProps({
                  item: emoji,
                  index,
                })}
              >
                <span className={ExtensionEmojiTheme.EMOJI_POPUP_CHAR}>
                  {emoji.emoji}
                </span>
                <span className={ExtensionEmojiTheme.EMOJI_POPUP_NAME}>
                  :{shortcode}:
                </span>
              </div>
            )
          })}
      </div>
    </FloatingWrapper>
  )
}


export default App;
