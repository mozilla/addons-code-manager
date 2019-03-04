type LinterMessageBase = {
  column: number | null;
  file: string;
  line: number | null;
  message: string;
  type: 'notice' | 'error' | 'warning';
  uid: string;
};

export type LinterMessage = LinterMessageBase & {
  description: string[];
};

export type ExternalLinterMessage = LinterMessageBase & {
  description: string | string[];
  // These are some extra properties that we don't need to work with.
  context: string[];
  for_appversions: object;
  id: string[];
  tier: number;
};

export type ExternalLinterResult = {
  error: null | string;
  full_report_url: string;
  upload: string;
  url: string;
  validation: {
    detected_type: string;
    ending_tier: number;
    errors: number;
    message_tree: object;
    messages: ExternalLinterMessage[];
    metadata: object;
    notices: number;
    success: boolean;
    warnings: number;
  };
};

export const createInternalMessage = (
  message: ExternalLinterMessage,
): LinterMessage => {
  return {
    column: message.column,
    description: Array.isArray(message.description)
      ? message.description
      : [message.description],
    file: message.file,
    line: message.line,
    message: message.message,
    type: message.type,
    uid: message.uid,
  };
};

type LinterMessageMap = {
  // The 'path' key matches the key of ExternalVersionFile['entries']
  [path: string]: {
    global: LinterMessage[];
    byLine: { [line: number]: LinterMessage[] };
  };
};

export const getMessageMap = (result: ExternalLinterResult) => {
  const msgMap: LinterMessageMap = {};

  result.validation.messages.forEach((message) => {
    if (!msgMap[message.file]) {
      msgMap[message.file] = { global: [], byLine: {} };
    }

    const internalMessage = createInternalMessage(message);
    const map = msgMap[message.file];

    if (message.line) {
      if (!map.byLine[message.line]) {
        map.byLine[message.line] = [];
      }
      map.byLine[message.line].push(internalMessage);
    } else {
      map.global.push(internalMessage);
    }
  });

  return msgMap;
};
