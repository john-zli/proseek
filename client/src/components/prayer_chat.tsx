import clsx from 'clsx';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import attachmentIcon from '../../assets/attachment.svg';
import clearIcon from '../../assets/clear.svg';
import sendIcon from '../../assets/send.svg';
import classes from '../App.module.less';
import { Button, ButtonStyle } from '../shared-components/button';
import { withTooltip } from '../shared-components/with_tooltip';
import { PrayerRequestChatsApi } from '@client/api/prayer_request_chats';
import { ModalContext, ModalType } from '@client/contexts/modal_context_provider';
import { Callout } from '@client/shared-components/callout';
import { useCaptcha } from '@client/widget/use_captcha';

interface PrayerRequestChatMessage {
  messageId: string;
  requestId: string;
  message: string;
  messageTimestamp: number;
  assignedUserId?: string;
  deletionTimestamp?: number;
}

interface Props {
  startsExpanded?: boolean;
}

export const PrayerChat = (props: Props) => {
  const { startsExpanded = false } = props;
  const [isExpanded, setIsExpanded] = useState(startsExpanded);
  const [messages, setMessages] = useState<PrayerRequestChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [hasScroll, setHasScroll] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [chatroomJustCreated, setChatroomJustCreated] = useState(false);
  const [showCallout, setShowCallout] = useState(true);
  const initialInputRef = useRef<HTMLTextAreaElement>(null);
  const expandedInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { openModal, closeModal } = useContext(ModalContext);
  const { solve } = useCaptcha();
  const navigate = useNavigate();
  const { chatroomId } = useParams();

  // Only show verification on initial page load with chatroomId in URL
  useEffect(() => {
    if (chatroomId && !isVerified && !chatroomJustCreated) {
      setShowCallout(false);
      // Show verification modal immediately if we have a chatroomId
      openModal(ModalType.ChatroomVerification, {
        onSubmit: handleVerification,
      });
    }
  }, [chatroomId, isVerified, chatroomJustCreated]);

  // Only load messages if we are entering a chatroom via params on page load,
  // and we've finished verification.
  const loadMessages = useCallback(async () => {
    if (!chatroomId || chatroomJustCreated || !isVerified) {
      return;
    }

    const response = await PrayerRequestChatsApi.listMessages({
      requestId: chatroomId,
    });
    setMessages(response.messages);
  }, [chatroomId, chatroomJustCreated, isVerified]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const handleVerification = useCallback(
    async (email: string | undefined, phone: string | undefined) => {
      const token = await solve();
      if (!token) {
        console.error('Failed to solve CAPTCHA');
        return;
      }

      try {
        // Verify the user's contact info matches the chatroom
        const response = await PrayerRequestChatsApi.verifyChatroomAccess({
          requestId: chatroomId!,
          requestContactEmail: email,
          requestContactPhone: phone,
          token,
        });

        if (response.isVerified) {
          setIsVerified(true);
          closeModal();
        } else {
          // If verification fails, keep the modal open
          console.error('Verification failed');
        }
      } catch (err) {
        console.error(err);
      }
    },
    [chatroomId, solve, closeModal]
  );

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const sendMessage = useCallback(() => {
    if (!inputValue.trim()) return;

    const messageId = uuidv4();
    // TODO(johnli): Add userId to the message if we are authenticated.
    setMessages(prev => [
      ...prev,
      { messageId, requestId: chatroomId!, message: inputValue, messageTimestamp: Date.now() },
    ]);
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

  const checkScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const hasScrollbar = messagesContainerRef.current.scrollHeight > messagesContainerRef.current.clientHeight;
      setHasScroll(hasScrollbar);
    }
  }, []);

  // Check scroll when messages change or on expand
  useEffect(() => {
    checkScroll();
  }, [messages, isExpanded, checkScroll]);

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

  const handleClearChat = useCallback(() => {
    setMessages([]);
    setInputValue('');
  }, []);

  const onSubmit = useCallback(
    async (email: string | undefined, phone: string | undefined) => {
      // Create a new chatroom with the user's contact info
      const token = await solve();
      if (!token) {
        console.error('Failed to solve CAPTCHA');
        return;
      }

      try {
        const response = await PrayerRequestChatsApi.createPrayerRequestChatroom({
          requestContactEmail: email,
          requestContactPhone: phone,
          token,
          messages: messages.map(msg => ({
            message: msg.message,
            messageId: msg.messageId,
            messageTimestamp: msg.messageTimestamp,
          })),
        });

        // Navigate to the new chatroom URL
        setChatroomJustCreated(true);
        setIsVerified(true);
        setShowCallout(false);
        navigate(`/chats/${response.chatroomId}`, { replace: true });
      } catch (err) {
        console.error(err);
      }
      closeModal();
    },
    [closeModal, messages, navigate, solve]
  );

  const handleSendRequest = useCallback(() => {
    openModal(ModalType.ContactInfo, { onSubmit });
  }, [openModal, onSubmit]);

  const clearButton = (
    <Button buttonStyle={ButtonStyle.Icon} onClick={handleClearChat}>
      <img src={clearIcon} alt="Clear chat" />
    </Button>
  );

  // If we have a chatroomId but haven't verified the user yet, don't render anything
  if (chatroomId && !isVerified) {
    return null;
  }

  return (
    <div className={classes.contents}>
      {!isExpanded && <h1 className={classes.initialHeading}>How can we pray for you?</h1>}
      <div className={`${classes.chatContainer} ${isExpanded ? classes.expandedChat : ''}`}>
        {isExpanded && (
          <>
            <div className={classes.chatHeader}>
              <div className={classes.chatHeaderLeft}>
                <span className={classes.chatTitle}>Prayer Chat</span>
              </div>
              {!chatroomId ? (
                <div className={classes.chatControls}>
                  <Button buttonStyle={ButtonStyle.Primary} onClick={handleSendRequest} className={classes.matchButton}>
                    Send Request
                  </Button>
                  {withTooltip(clearButton, 'Clear chat history')}
                </div>
              ) : (
                <div className={classes.chatControls}>
                  <p>Matching with a local church...</p>
                </div>
              )}
            </div>
            {showCallout && (
              <div className={classes.calloutContainer}>
                <Callout delaySeconds={0.3}>
                  <div className={classes.calloutContent}>
                    <h3>Share your prayer requests</h3>
                    <p>
                      Type your thoughts, concerns, or prayer needs in the chat. When you're ready to send them to the
                      church, click <strong>Send Request</strong>!
                    </p>
                    <p>
                      When you send a request, we will match you with a local church who will pray through your request.
                    </p>
                    <p>
                      It may take a while for someone to respond. We'll notify you when someone from the church has
                      matched responds, and we'll send you a link to this chatroom via email or text.
                    </p>
                    <p>
                      Your prayer partner will follow up with you through this chat. Once matched, this chat can also
                      support video calls if you would prefer chatting in person while keeping your identity private.
                    </p>
                  </div>
                </Callout>
              </div>
            )}
          </>
        )}
        {!isExpanded ? (
          <div className={classes.inputForm}>
            <textarea
              ref={initialInputRef}
              rows={1}
              placeholder="Start typing..."
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className={classes.chatInput}
            />
            <div className={classes.inputActions}>
              <Button buttonStyle={ButtonStyle.Icon} onClick={() => {}}>
                <img src={attachmentIcon} alt="Attach" />
              </Button>
              <Button buttonStyle={ButtonStyle.Primary} onClick={sendMessage} className={classes.rounded}>
                <img src={sendIcon} alt="Send" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div
              ref={messagesContainerRef}
              className={`${classes.messagesContainer} ${hasScroll ? classes.hasScrollbar : ''}`}
            >
              <div className={classes.messages}>
                {messages?.map(message => (
                  <div
                    key={message.messageId}
                    className={`${classes.message} ${!message.assignedUserId ? classes.userMessage : classes.aiMessage}`}
                  >
                    {message.message}
                  </div>
                ))}
              </div>
            </div>
            <div className={clsx(classes.inputForm, classes.expanded)}>
              <div className={classes.textAreaContainer}>
                <textarea
                  ref={expandedInputRef}
                  rows={1}
                  placeholder="Start typing..."
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className={clsx(classes.chatInput, classes.expanded)}
                />
              </div>
              <div className={classes.inputActions}>
                <Button buttonStyle={ButtonStyle.Icon} onClick={() => {}}>
                  <img src={attachmentIcon} alt="Attach" />
                </Button>
                <Button buttonStyle={ButtonStyle.Primary} onClick={sendMessage} className={classes.rounded}>
                  <img src={sendIcon} alt="Send" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
