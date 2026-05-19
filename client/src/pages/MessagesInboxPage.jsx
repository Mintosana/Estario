import { ExternalLink, Inbox, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../api/axiosClient.js";
import { getConversations } from "../api/messagesApi.js";
import { statusLabels } from "../constants/statusLabels.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

function formatMessageDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function MessagesInboxPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadConversations() {
      setIsLoading(true);
      setError("");

      try {
        const response = await getConversations();
        if (isMounted) {
          setConversations(response.data);
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

    loadConversations();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (error) {
      showToast({ message: error, type: "error" });
    }
  }, [error, showToast]);

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Mesaje</h1>
          <p>Conversatii cu proprietari si persoane interesate de anunturile tale.</p>
        </div>
        <Link className="secondary-button" to="/my-listings">
          Anunturile mele
        </Link>
      </div>

      {isLoading ? <div className="page-status">Se incarca mesajele...</div> : null}

      {!isLoading && conversations.length === 0 ? (
        <div className="empty-state">
          <Inbox size={28} aria-hidden="true" />
          <h2>Nu ai conversatii inca</h2>
          <p>Conversatiile pornesc cand trimiti sau primesti un mesaj pentru un anunt aprobat.</p>
        </div>
      ) : null}

      {!isLoading && conversations.length > 0 ? (
        <div className="inbox-list">
          {conversations.map((conversation) => {
            const otherParticipant = conversation.ownerId === user.id ? conversation.buyer : conversation.owner;
            const lastMessage = conversation.lastMessage;

            return (
              <article className={`inbox-item ${conversation.hasUnread ? "inbox-item-unread" : ""}`} key={conversation.id}>
                <div className="inbox-icon" aria-hidden="true">
                  <Mail size={20} />
                </div>
                <div className="inbox-content">
                  <div className="inbox-topline">
                    <div>
                      <h2>{conversation.listing.title}</h2>
                      <p>
                        Cu {otherParticipant.name} - {conversation.listing.city}, {conversation.listing.county}
                      </p>
                    </div>
                    <span className={`status-badge status-${conversation.listing.status.toLowerCase()}`}>
                      {statusLabels[conversation.listing.status]}
                    </span>
                  </div>

                  {lastMessage ? (
                    <>
                      <div className="inbox-meta">
                        <strong>{lastMessage.sender?.name ?? lastMessage.senderName}</strong>
                        <span>{formatMessageDate(lastMessage.createdAt)}</span>
                        {conversation.unreadCount > 0 ? (
                          <span className="unread-pill">
                            {conversation.unreadCount} {conversation.unreadCount === 1 ? "mesaj necitit" : "mesaje necitite"}
                          </span>
                        ) : null}
                      </div>
                      <p className="inbox-message">{lastMessage.message}</p>
                    </>
                  ) : null}

                  <div className="inbox-actions">
                    <Link className="secondary-button compact-button inbox-link" to={`/messages/${conversation.id}`}>
                      <ExternalLink size={15} aria-hidden="true" />
                      Deschide conversatia
                    </Link>
                    <Link className="secondary-button compact-button inbox-link" to={`/listings/${conversation.listing.id}`}>
                      Vezi anuntul
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
