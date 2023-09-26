import React, { forwardRef } from "react";
// import styled from "styled-components";
import ItemTest from "./ItemTest";
import SimpleBarReact from "simplebar-react";
import { DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import LiItem from "./LiItem";

export const GroupItem = forwardRef(({ id, handleProps, ...props }, ref) => {
    return (
        <div {...props} ref={ref} style={{borderStyle: 'solid', height: '60vh'}}>
            {Object.hasOwn(props, 'props') > 0 &&
                <SimpleBarReact className='simple-react-bar'>
                    <DndContext>
                        <div style={{display: 'flex'}}>
                            <h2 style={{ color: "white" }}>{props.props.group.group_name}</h2>
                        </div>
                        <SortableContext items={props.props.group.channels} strategy={verticalListSortingStrategy}>
                            {props.props.group.channels.map((item, index) => {
                                return (
                                    <LiItem
                                        key={item.id}
                                        id={item.id}
                                        text="Following: "
                                        word={item.channel_name}
                                    />
                                );
                            })}
                        </SortableContext>
                    </DndContext>
                 </SimpleBarReact>
            }
        </div>
    );
});

export default ItemTest;