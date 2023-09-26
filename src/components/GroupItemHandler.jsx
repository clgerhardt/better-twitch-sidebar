import React from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { GroupItem } from "./GroupItem";

const GroupItemHandler = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <GroupItem
      props={props}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      handleProps={{setActivatorNodeRef, ...listeners}}
    ></GroupItem>
  );
};

export default GroupItemHandler;
