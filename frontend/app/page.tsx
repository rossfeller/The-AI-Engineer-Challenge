"use client";

import { useState, useRef, useEffect } from "react";
import { streamChatMessage } from "@/lib/api";
import styles from "./page.module.css";

type Message = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);
    setStreamingContent("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const fullReply = await streamChatMessage(text, (token) => {
        setStreamingContent((prev) => prev + token);
      });
      setMessages((prev) => [...prev, { role: "assistant", content: fullReply }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
      setStreamingContent("");
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.frame}>
        <header className={styles.header}>
          <h1 className={styles.title}>MENTAL COACH</h1>
          <p className={styles.subtitle}>NES-style support</p>
        </header>

        <div className={styles.chatArea}>
          {messages.length === 0 && !error && !streamingContent && (
            <p className={styles.placeholder}>
              Type a message and press ENTER. Ask about stress, motivation, habits, or confidence.
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={msg.role === "user" ? styles.bubbleUser : styles.bubbleAssistant}
            >
              <span className={styles.bubbleLabel}>{msg.role === "user" ? "YOU" : "COACH"}</span>
              <p className={styles.bubbleText}>{msg.content}</p>
            </div>
          ))}
          {loading && (
            <div className={styles.bubbleAssistant}>
              <span className={styles.bubbleLabel}>COACH</span>
              {streamingContent ? (
                <p className={styles.bubbleText}>{streamingContent}</p>
              ) : (
                <p className={styles.bubbleText}>
                  <span className={styles.loadingDots}>
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>
                </p>
              )}
            </div>
          )}
          {error && (
            <div className={styles.errorBox}>
              <span className={styles.errorLabel}>ERROR</span>
              <p className={styles.errorText}>{error}</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Your message..."
            className={styles.input}
            disabled={loading}
            aria-label="Message"
          />
          <button type="submit" className={styles.button} disabled={loading}>
            SEND
          </button>
        </form>
      </div>
    </main>
  );
}
