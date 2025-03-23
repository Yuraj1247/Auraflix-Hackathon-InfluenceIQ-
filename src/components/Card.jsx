import { forwardRef } from 'react';

const Card = forwardRef(({ title, content, extra }, ref) => {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div ref={ref}>{content}</div>
      {extra}
    </div>
  );
});

export default Card;