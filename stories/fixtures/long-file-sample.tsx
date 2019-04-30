export default `import type {BrowserTab} from './tab';

export type TabListMessage = {|
  action: 'tabListChanged',
  data: {tabs: Array<BrowserTab>},
|};

class Background {
  tabList: Array<BrowserTab>;
  visitedTabs: Array<BrowserTab>;
  popupIsOpen: boolean;

  constructor() {
    this.visitedTabs = [];
    this.tabList = [];
    this.popupIsOpen = false;

    chrome.tabs.onActivated.addListener(this.onActivated);
    chrome.tabs.onUpdated.addListener(this.onTabsUpdated);
    chrome.tabs.onRemoved.addListener(this.onTabRemoved);

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!message.background) {
        return;
      }
      console.log('Background: got message:', message);

      let readMessage;
      switch (message.action) {
        case 'getTabs':
          readMessage = this.getTabsForPopup();
          break;
        case 'openPopup':
          readMessage = this.onPopupOpen();
          break;
        case 'closePopup':
          readMessage = this.onPopupClose();
          break;
        default:
          throw new Error(
            \`Background got an unexpected action\`);
      }

      readMessage.then(reply => sendResponse(reply))
        .catch(error => {
          console.error('Background: error reading message', error);
        });

      return true;
    });
  }

  onPopupOpen() {
    this.popupIsOpen = true;
    return Promise.resolve();
  }

  onPopupClose() {
    this.popupIsOpen = false;
    return Promise.resolve();
  }

  sendToPopup(message) {
    return new Promise((resolve, reject) => {
      const id = undefined;
      const options = undefined;
      chrome.runtime.sendMessage(
        id,
        {
          popup: true,
          ...message,
        },
        options,
        (result) => {
          if (chrome.runtime.lastError) {
            console.log(
              'background: got error:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
            resolve(result);
          }
        }
      );
    });
  }

  onTabsUpdated = (tabId, changeInfo, tab) => {
    console.log(\`background: Tab was updated\`, changeInfo);
    this.visitedTabs = this.visitedTabs.map(
      oldTab => oldTab.id === tab.id ? tab : oldTab);
    this.tabList = this.tabList.map(
      oldTab => oldTab.id === tab.id ? tab : oldTab);

    if (this.popupIsOpen) {
      const message: TabListMessage = {
        action: 'tabListChanged',
        data: {tabs: this.tabList},
      };
      this.sendToPopup(message);
    }
  }

  onTabRemoved = (tabId) => {
    console.log(\`background: Tab was removed\`);
    this.visitedTabs = this.visitedTabs.filter(tab => tab.id !== tabId);
    this.tabList = this.tabList.filter(tab => tab.id !== tabId);

    if (this.popupIsOpen) {
      this.sendToPopup({
        action: 'tabListChanged',
        data: {tabs: this.tabList},
      });
    }
  }

  onActivated = (activeInfo) => {
    const {tabId} = activeInfo
    this.getTab(tabId).then(tab => {
      this.visitedTabs.unshift(tab);
      if (this.visitedTabs.length > 2) {
        this.visitedTabs.pop();
      }
      console.log(\`background: Active tab changed\`);
    });
  }

  getTab(tabId) {
    return new Promise((resolve, reject) => {
      chrome.tabs.get(tabId, tab => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        resolve(tab);
      });
    });
  }

  queryTabs(query) {
    return new Promise((resolve, reject) => {
      chrome.tabs.query(query, tabs => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        resolve(tabs);
      });
    });
  }

  getTabsForPopup = () => {
    return this.queryTabs({audible: true})
      .then((audibleTabs) => {
        const newTabList = [];
        if (this.visitedTabs[1]) {
          // Put the last viewed site at the top of the list so you
          // can easily jump between what you're working on and what
          // you're listening to.
          newTabList.push(this.visitedTabs[1]);
        }

        function addUniqueTabs(tabList) {
          const existingIds = new Set(newTabList.map(tab => tab.id));
          tabList.forEach(tab => {
            if (!existingIds.has(tab.id)) {
              newTabList.push(tab);
            }
          });
        }

        addUniqueTabs(audibleTabs);
        // Keep inaudible tabs around since the music may have just been paused
        addUniqueTabs(this.tabList);

        while (newTabList.length > 10) {
          newTabList.pop();
        }

        this.tabList = newTabList;
        return this.tabList;
      })
      .catch((error) => {
        console.log('background: getTabsForPopup: error:', error);
      });
  }

  listen() {
    console.log('background: listening for info about audible websites');
  }
}

const background = new Background();
background.listen();
`;
