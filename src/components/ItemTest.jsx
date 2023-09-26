import React, { forwardRef } from "react";
import styled from "styled-components";

const Li = styled.li`
  width: 80%;
  height: 50px;
  background-color: #d3d3d3;
  border-radius: 10px;
  margin: 0.5rem;
  list-style: none;
  padding: 0;

  display: flex;
  justify-content: space-around;
  align-items: center;
  user-select: none;
`;

export const ItemTest = forwardRef(({ id, ...props }, ref) => {
  return (
    <Li {...props} ref={ref}>
      {Object.hasOwn(props, 'props') > 0 && <p>
        {props.props.text} {props.props.word}
      </p>}
    </Li>
  );
});

export default ItemTest;
