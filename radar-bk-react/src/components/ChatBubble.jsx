export default function ChatBubble({ role, text }) {
  const mine = role === 'q'
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm shadow ${
          mine ? 'rounded-br-sm bg-indigo-600 text-white' : 'rounded-bl-sm bg-white text-gray-800'
        }`}
      >
        {text}
      </div>
    </div>
  )
}
