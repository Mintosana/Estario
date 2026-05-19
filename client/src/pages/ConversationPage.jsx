import { ArrowLeft, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getApiErrorMessage } from "../api/axiosClient.js";
import { getConversation, replyToConversation } from "../api/messagesApi.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

function formatMessageDate(value) {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function ConversationPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [conversation, setConversation] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadConversation() {
      setIsLoading(true);
      setError("");

      try {
        const response = await getConversation(id);
        if (isMounted) {
          setConversation(response.data);
        }
      } catch (apiError) {
        if (isMounted) {
          setError(getApiErrorMessage(apiError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadConversation();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [conversation?.messages.length]);

  useEffect(() => {
    if (error && conversation) {
      showToast({ message: error, type: "error" });
    }
  }, [conversation, error, showToast]);

  async function submitReply(event) {
    event.preventDefault();
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await replyToConversation(id, { message: trimmedMessage });
      setConversation(response.data);
      setMessage("");
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="page-status">Se incarca conversatia...</div>;
  }

  if (error && !conversation) {
    return (
      <div className="page-status">
        <p className="form-error">{error}</p>
        <Link to="/messages">Inapoi la mesaje</Link>
      </div>
    );
  }

  const otherParticipant = conversation.ownerId === user.id ? conversation.buyer : conversation.owner;

  return (
    <section className="conversation-page">
      <Link className="back-link" to="/messages">
        <ArrowLeft size={16} aria-hidden="true" />
        Inapoi la mesaje
      </Link>

      <div className="conversation-shell">
        <header className="conversation-header">
          <div>
            <h1>{conversation.listing.title}</h1>
            <p>
              Conversatie cu {otherParticipant.name} pentru {conversation.listing.city}, {conversation.listing.county}
            </p>
          </div>
          <Link className="secondary-button compact-button" to={`/listings/${conversation.listing.id}`}>
            Vezi anuntul
          </Link>
        </header>

        <div className="conversation-messages" aria-label="Mesajele conversatiei">
          {conversation.messages.map((item) => {
            const isOwnMessage = item.senderId === user.id;

            return (
              <article className={`thread-message ${isOwnMessage ? "own-message" : ""}`} key={item.id}>
                <div>
                  <strong>{item.sender?.name ?? item.senderName}</strong>
                  <span>{formatMessageDate(item.createdAt)}</span>
                  {isOwnMessage && item.readAt ? <span>Citit</span> : null}
                </div>
                <p>{item.message}</p>
              </article>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form className="conversation-reply" onSubmit={submitReply}>
          <label>
            Raspuns
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={2000}
              minLength={2}
              rows={4}
              required
            />
          </label>
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            <Send size={18} aria-hidden="true" />
            {isSubmitting ? "Se trimite..." : "Trimite raspuns"}
          </button>
        </form>
      </div>
    </section>
  );
}
