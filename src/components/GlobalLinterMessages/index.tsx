import * as React from 'react';

import { LinterMessage as LinterMessageType } from '../../reducers/linter';
import LinterMessage from '../LinterMessage';
import { getCodeLineAnchorID } from '../CodeView/utils';

export type PublicProps = {
  className?: string;
  messages: LinterMessageType[] | null | void;
  containerRef?: (element: HTMLDivElement | null) => void;
};

const GlobalLinterMessages = ({
  className,
  messages,
  containerRef,
}: PublicProps) => {
  return messages && messages.length ? (
    <div className={className} id={getCodeLineAnchorID(0)} ref={containerRef}>
      {messages.map((msg) => (
        <LinterMessage key={msg.uid} message={msg} />
      ))}
    </div>
  ) : null;
};

export default GlobalLinterMessages;
