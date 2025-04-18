import { useCallback, useEffect, useRef, useState } from 'react';

import attachmentIcon from '../assets/attachment.svg';
import sendIcon from '../assets/send.svg';
import classes from './App.module.less';
import { Button, ButtonStyle } from './shared-components/button';

function App() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean; id: number }>>([]);
  const [inputValue, setInputValue] = useState('');
  const initialInputRef = useRef<HTMLTextAreaElement>(null);
  const expandedInputRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const sendMessage = useCallback(() => {
    if (!inputValue.trim()) return;

    const messageId = Date.now();
    setMessages(prev => [...prev, { text: inputValue, isUser: true, id: messageId }]);
    setInputValue('');
    setIsExpanded(true);
  }, [inputValue]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    adjustTextareaHeight(e.target);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  // Focus the appropriate input when available and adjust height
  useEffect(() => {
    if (isExpanded && expandedInputRef.current) {
      expandedInputRef.current.focus();
      adjustTextareaHeight(expandedInputRef.current);
    } else if (initialInputRef.current) {
      initialInputRef.current.focus();
      adjustTextareaHeight(initialInputRef.current);
    }
  }, [isExpanded, inputValue]);

  return (
    <div className={classes.root}>
      <div className={classes.contents}>
        {!isExpanded && <h1 className={classes.initialHeading}>What can I help with?</h1>}
        <div className={`${classes.chatContainer} ${isExpanded ? classes.expandedChat : ''}`}>
          {!isExpanded ? (
            <div className={classes.inputForm}>
              <textarea
                ref={initialInputRef}
                rows={1}
                placeholder="Ask anything"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className={classes.chatInput}
              />
              <div className={classes.inputActions}>
                <button type="button" className={classes.actionButton}>
                  <img src={attachmentIcon} alt="Attach" />
                </button>
                <Button buttonStyle={ButtonStyle.Primary} onClick={sendMessage} className={classes.rounded}>
                  <img src={sendIcon} alt="Send" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className={classes.messagesContainer}>
                <div className={classes.messages}>
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`${classes.message} ${message.isUser ? classes.userMessage : classes.aiMessage}`}
                    >
                      {message.text}
                    </div>
                  ))}
                </div>
              </div>
              <div className={classes.inputForm}>
                <textarea
                  ref={expandedInputRef}
                  rows={1}
                  placeholder="Ask anything"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className={classes.chatInput}
                />
                <div className={classes.inputActions}>
                  <button type="button" className={classes.actionButton}>
                    <img src={attachmentIcon} alt="Attach" />
                  </button>
                  <Button buttonStyle={ButtonStyle.Primary} onClick={sendMessage} className={classes.rounded}>
                    <img src={sendIcon} alt="Send" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
