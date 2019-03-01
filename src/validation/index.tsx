type Message = {
  column: number | null;
  description: string;
  file: string;
  line: number | null;
  message: string;
  type: 'notice' | 'error' | 'warning';
  uid: string;
};

export type ExternalMessage = Message & {
  // These are some extra properties that we don't need to work with.
  context: string[];
  for_appversions: object;
  id: string[];
  tier: number;
};

type ExternalValidation = {
  error: null | string;
  full_report_url: string;
  upload: string;
  url: string;
  validation: {
    detected_type: string;
    ending_tier: number;
    errors: number;
    message_tree: object;
    messages: ExternalMessage[];
    metadata: object;
    notices: number;
    success: boolean;
    warnings: number;
  };
};

const createInternalMessage = (message: ExternalMessage): Message => {
  return {
    column: message.column,
    description: message.description,
    file: message.file,
    line: message.line,
    message: message.message,
    type: message.type,
    uid: message.uid,
  };
};

type MessageMap = {
  [relativeFileName: string]: {
    global: Message[];
    byLine: { [line: number]: Message[] };
  };
};

export const getMessageMap = (validation: ExternalValidation) => {
  const msgMap: MessageMap = {};

  validation.validation.messages.forEach((message) => {
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
