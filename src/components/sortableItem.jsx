import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function Item(props) {
  const { id, item } = props;
  const style = {
    height: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid #9a9a9a",
    margin: "3px",
    padding: '2px',
    background: "white",
    borderRadius: 8
  };
  return (
    <div style={style}> 
      <img src={item.channel_profile_image} alt="" style={{width: 30, height: 30}}/> 
      {item.channel_name}
    
    </div>
  )
}

export default function SortableItem(props) {
  const { children, handlePosition = "right", id } = props;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    flex: 1,
    position: "relative"
  };

  let handleStyle = {
    position: "absolute",
    fontSize: 36,
    color: "black",
    cursor: "grab"
  };

  const rightHandleStyle = {
    right: 25,
    top: 0,
    bottom: 0,
    transform: "rotate(90deg)"
  };

  const topHandleStyle = {
    right: 40,
    top: 0
  };

  if (handlePosition === "right") {
    handleStyle = {
      ...handleStyle,
      ...rightHandleStyle
    };
  } else if (handlePosition === "top") {
    handleStyle = {
      ...handleStyle,
      ...topHandleStyle
    };
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
      {/* <div  style={handleStyle}>
        ...
      </div> */}
    </div>
  );
}
