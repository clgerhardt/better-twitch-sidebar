import React, { useEffect, useState } from "react";
import LiItem from "./LiItem";
import SimpleBarReact from "simplebar-react";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import ItemTest from "./ItemTest";
import { GroupItem } from "./GroupItem";
import GroupItemHandler from "./GroupItemHandler";

function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

const ListTest = ({ sideBarList }) => {
  const lis = [
    { fruit: "--0", _id: "0" },
    { fruit: "--1", _id: "1" },
    { fruit: "--2", _id: "2" },
    { fruit: "--3", _id: "3" },
    { fruit: "--4", _id: "4" }
    // { fruit: "--5", _id: 5 },
    // { fruit: "--6", _id: 6 },
    // { fruit: "--7", _id: 7 },
    // { fruit: "--8", _id: 8 }
  ];
  // const [activeId, setActiveId] = useState(null);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [items, setItems] = useState(lis);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // function handleDragStart(event) {
  //   const { active } = event;
  //   console.log("start item", active);
  //   console.log("start", active.id);

  //   setActiveId(active.id);
  // }

  function handleDragStartForGroup(event) {
    const { active } = event;
    // console.log("start item", active);
    // console.log("start", active.id);

    setActiveGroupId(active.id);
  }

  function handleDragEndForGroup(event) {
    const { active, over } = event;
    // console.log("end", active.id, over.id);

    if (active && over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((it) => it._id === active?.id);
        const newIndex = items.findIndex((it) => it._id === over?.id);
        // console.log("indexes", oldIndex, newIndex);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveGroupId(null);
  }

  // function handleDragEnd(event) {
  //   const { active, over } = event;
  //   console.log("end", active.id, over.id);

  //   if (active && over && active.id !== over.id) {
  //     setItems((items) => {
  //       const oldIndex = items.findIndex((it) => it._id === active?.id);
  //       const newIndex = items.findIndex((it) => it._id === over?.id);
  //       // console.log("indexes", oldIndex, newIndex);

  //       return arrayMove(items, oldIndex, newIndex);
  //     });
  //   }
  //   setActiveId(null);
  // }


  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStartForGroup} onDragEnd={handleDragEndForGroup}>
      <SortableContext items={sideBarList} strategy={verticalListSortingStrategy}>
        {sideBarList.map((group, index) => {
          return (
            <GroupItemHandler
              key={group.id}
              id={group.id}
              group={group}
            >
            </GroupItemHandler>
          );
        })}
      </SortableContext>
      <DragOverlay>
         {activeGroupId ? <GroupItem id={activeGroupId} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default ListTest;
