import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";

import SortableItem, {Item} from "./sortableItem";
import SimpleBarReact from "simplebar-react";

const containerStyle = {
  background: "#dadada",
  padding: "10px 10px 10px",
  flex: 1,
  borderRadius: 8,
  border: "1px solid #ababab",
  display: "flex",
  alignSelf: "stretch",
  height: '35vh'
};

export const Container = React.forwardRef((props, ref) => {
  const { children, row, style = {} } = props;

  return (
      <div
        ref={ref}
        style={{
          ...containerStyle,
          ...style,
          flexDirection: row ? "row" : "column"
        }}
      >
        <SimpleBarReact className='simple-react-bar'>
          {children}
        </SimpleBarReact>
      </div>
  );
});

export default function SortableContainer(props) {
  const { getItems, id, row, style = { margin: "1px 1px" }, group } = props;
  const items = getItems(id);
  const itemIds = items.map((item) => item.id);

  const { isOver, setNodeRef } = useDroppable({
    id
  });

  if (isOver) {
    console.log("is over", id);
  }

  return (
    <SortableItem id={id} handlePosition="top">
      <Container
        ref={setNodeRef}
        row={row}
        style={{ ...style, backgroundColor: row ? "#cdcdcd" : "transparent" }}
      >
        <SortableContext
          items={itemIds}
          strategy={
            row ? horizontalListSortingStrategy : verticalListSortingStrategy
          }
        >
          {/* TODO: add group name here if instance of group */}
          {group.group_name}
          {items.map((item) => {
            let child = <Item id={item.id} item={item} />;

            if (item.container) {
              return (
                <SortableContainer
                  key={item.id}
                  id={item.id}
                  getItems={getItems}
                  row={item.row}
                  handlePosition="top"
                />
              );
            }

            return (
              <SortableItem key={item.id} id={item.id}>
                {child}
              </SortableItem>
            );
          })}
        </SortableContext>
      </Container>
    </SortableItem>
  );
}
