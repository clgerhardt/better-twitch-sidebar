import React from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import ItemTest from "./ItemTest";

const LiItem = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <ItemTest
      props={props}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    ></ItemTest>
  );
};

export default LiItem;
