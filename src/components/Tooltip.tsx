import React from 'react';

type TooltipProps = {
  text: string;
};

const Tooltip: React.FC<TooltipProps> = ({ text }) => (
  <span className="tooltip" aria-label={text}>
    ⓘ
    <span className="tooltip-content">{text}</span>
  </span>
);

export default Tooltip;
