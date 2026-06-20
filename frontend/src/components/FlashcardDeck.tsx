'use client'

import { useState } from 'react'
import type { Flashcard } from '@/lib/types'

interface FlashcardDeckProps {
  flashcards: Flashcard[]
}

function FlashcardItem({ card }: { card: Flashcard }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      className={`flashcard ${flipped ? 'flipped' : ''}`}
      onClick={() => setFlipped(!flipped)}
      id={`flashcard-${card.id}`}
    >
      <div className="flashcard-inner">
        {/* Front — Question */}
        <div className="flashcard-front">
          <div className="flashcard-number">
            Question {card.id} / 10
          </div>
          <div className="flashcard-question">
            {card.question}
          </div>
          <div className="flashcard-footer">
            <span className={`badge badge-${card.difficulty === 'beginner' ? 'queued' : card.difficulty === 'intermediate' ? 'processing' : 'failed'}`}>
              {card.difficulty}
            </span>
            <span className="flashcard-flip-hint">
              Click to reveal ↩
            </span>
          </div>
        </div>

        {/* Back — Answer */}
        <div className="flashcard-back">
          <div className="flashcard-number">
            Answer {card.id} / 10
          </div>
          <div className="flashcard-answer">
            {card.model_answer}
          </div>
          {card.follow_up && (
            <div className="flashcard-followup">
              <strong>Follow-up:</strong> {card.follow_up}
            </div>
          )}
          <div className="flashcard-footer">
            <span className="flashcard-tag">#{card.topic_tag}</span>
            <span className="flashcard-flip-hint">
              Click to flip back ↩
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FlashcardDeck({ flashcards }: FlashcardDeckProps) {
  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--space-lg)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        💡 Click any card to reveal the model answer and follow-up question.
      </div>
      <div className="flashcard-grid">
        {flashcards.map((card) => (
          <FlashcardItem key={card.id} card={card} />
        ))}
      </div>
    </div>
  )
}
