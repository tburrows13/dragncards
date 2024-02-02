
import React, { useCallback, useEffect, useState } from "react";
import { DragDropContext } from "react-beautiful-dnd";
import { useSelector, useDispatch } from 'react-redux';
import { setStackIds, setCardIds, setGroupById } from "../store/gameUiSlice";
import { reorderGroupStackIds } from "./Reorder";
import store from "../../store";
import { setDraggingEnd, setDraggingEndDelay, setDraggingStackId, setDraggingFromGroupId } from "../store/playerUiSlice";
import { Table } from "./Table";
import { useDoActionList } from "./hooks/useDoActionList";
import { ArcherContainer } from 'react-archer';

let draggableClientRect = null;

const getAfterDragName = (game, stackId, destGroupId, allowFlip) => {
  const stack = game.stackById[stackId];
  const cardIds = stack.cardIds;
  const cardId = cardIds[0];
  const card = game.cardById[cardId];

  if (!allowFlip) return card?.sides?.[card?.currentSide]?.name;
  
  const destGroup = game.groupById[destGroupId];
  const destGroupCurrentSide = destGroup?.onCardEnter?.currentSide;
  
  if (destGroupCurrentSide) {
    return card?.sides?.[destGroupCurrentSide]?.name;
  }
  return card?.sides?.[card?.currentSide]?.name;
}

export const DragContainer = React.memo(({}) => {
  console.log("Rendering DragContainer");
  const dispatch = useDispatch();
  const doActionList = useDoActionList();
  const [isDragging, setIsDragging] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mouseDownPosition, setMouseDownPosition] = useState({ x: 0, y: 0 });
  const keypressShift = useSelector(state => state?.playerUi?.keypress?.Shift);
  const droppableRefs = {};

  const addDroppableRef = useCallback((id) => (ref) => {
    droppableRefs[id] = ref;
  }, []);

  const updateMousePosition = ev => {
    setMousePosition({ x: ev.clientX, y: ev.clientY });
  };

  const updateMouseDown = (e) => {
    console.log("updateMouseDown", e)
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    console.log(`Relative mouse position: ${x}, ${y}`);
    setMouseDownPosition({ x: x, y: y });
  }

  const onBeforeDragStart = (result) => {
    console.log("onBeforeDragStart", result)
    dispatch(setDraggingFromGroupId(result.source.droppableId));
    dispatch(setDraggingStackId(result.draggableId));
    dispatch(setDraggingEnd(false));
    dispatch(setDraggingEndDelay(false));

    setIsDragging(true);
  }

  // const onDragUpdate = (result) => {
  //   const draggableNode = document.querySelector(`[data-rbd-draggable-id="${result.draggableId}"]`);
  //   const draggableRect = draggableNode.getBoundingClientRect();
  //   console.log("onDragUpdate", draggableRect.x, draggableRect.y)
  // }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", updateMousePosition);
    }

    return () => {
      if (isDragging) {
        document.removeEventListener("mousemove", updateMousePosition);
      }
    };
  }, [isDragging]);

  useEffect(() => {
    document.addEventListener("mousedown", updateMouseDown);

    return () => {
      document.removeEventListener("mousedown", updateMouseDown);
    };
  }, []);


  const onDragEnd = (result) => {
    console.log("onDragEnd", result)
    const game = store.getState()?.gameUi.game;
    const groupById = game.groupById;
    const orig = result.source;
    const origGroupId = orig.droppableId;
    const origGroup = groupById[origGroupId];
    const origGroupStackIds = origGroup.stackIds;
    const origStackId = origGroupStackIds[orig.index];    
    const origStack = game.stackById[origStackId];
    const origStackCardIds = origStack.cardIds;
    const topOfOrigStackCardId = origStackCardIds[0];
    const topOfOrigStackCard = game.cardById[topOfOrigStackCardId];
    const allowFlip = keypressShift ? false : true; 
    const dest = result.combine ? result.combine : result.destination;
    const destGroupId = dest?.droppableId;
    const afterDragName = getAfterDragName(game, origStackId, destGroupId, allowFlip);

    var destGroup = null;

    setIsDragging(false);

    dispatch(setDraggingFromGroupId(null));
    dispatch(setDraggingEnd(true));
    setTimeout(() => {
      dispatch(setDraggingStackId(null));
      dispatch(setDraggingEndDelay(true))
    }, 100);



    const draggableNode = document.querySelector(`[data-rbd-draggable-id="${result.draggableId}"]`);

    console.log("Dropped in: ", destGroupId, Object.keys(droppableRefs), droppableRefs[destGroupId], draggableNode)
    var stackLeft = 0;
    var stackTop = 0;

    if (droppableRefs?.[destGroupId]) {
      const droppableRect = droppableRefs[destGroupId].getBoundingClientRect();
      const xRelative = mousePosition.x - mouseDownPosition.x - droppableRect.left;
      const yRelative = mousePosition.y - mouseDownPosition.y - droppableRect.top;
      stackLeft = xRelative/droppableRect.width*100;
      stackTop = yRelative/droppableRect.height*100;

      console.log('Relative Position: ', mousePosition.x, mousePosition.y, droppableRect.left, droppableRect.top, xRelative, yRelative, stackLeft, stackTop);
    }
    
    // Combine
    if (result.combine) {
      
      destGroup = game["groupById"][destGroupId];
      const destGroupStackIds = groupById[destGroupId].stackIds;

      dest.index = -1;
      for(var i=0; i<=destGroupStackIds.length; i++) {
        if(destGroupStackIds[i] === dest.draggableId){
          dest.index = i;
        }
      }
      if (!dest.index < 0) return;
      const destStackId = destGroupStackIds[dest.index];
      const destStack = game.stackById[destStackId];
      const destStackCardIds = destStack.cardIds;
      const newDestStackCardIds = destStackCardIds.concat(origStackCardIds);

      const newDestStack = {
        ...destStack,
        cardIds: newDestStackCardIds,
      }

      const newOrigGroupStackIds = Array.from(origGroupStackIds);
      newOrigGroupStackIds.splice(orig.index, 1);

      const newOrigGroup = {
        ...origGroup,
        stackIds: newOrigGroupStackIds
      }   
      // We could add some logic here to flip the card locally instantly, but there would still be a delay to get load the image
      // const updates = [["cardById",topOfOrigStackCardId,"currentSide", "A"]];
      // dispatch(setValues({updates: updates}));

      dispatch(setStackIds(newOrigGroup)); // This results is a jitter because the cardIndex is still 0 so it's briefly placed in the parent spot
      dispatch(setCardIds(newDestStack));
      doActionList([
        ["LOG", "$ALIAS_N", " attached ", afterDragName, " from ", "$GAME.groupById."+origGroupId+".label", " to ", ["FACEUP_NAME_FROM_STACK_ID", destStackId], "."],
        ["MOVE_STACK", origStackId, destGroupId, dest.index, {"combine": true, "allowFlip": allowFlip}]
      ])
    }

    
    // Dragged somewhere
    else {
      // Dropped nowhere
      if (!result.destination) {
        return;
      } 
      destGroup = game["groupById"][destGroupId];

      // Did not move anywhere - can bail early
      if (
        orig.droppableId === dest.droppableId &&
        orig.index === dest.index
      ) {
        // Do nothing
        return;
      } else {
        // Moved to a different spot
        const newGroupById = reorderGroupStackIds(groupById, orig, dest);
        // We could add some logic here to flip the card locally instantly, but there would still be a delay to get load the image
        // const updates = [["game", "cardById", topOfOrigStackCardId, "currentSide", "A"]];
        // dispatch(setValues({updates: updates}));
        doActionList([
          ["LOG", "$ALIAS_N", " moved ", afterDragName, " from ", "$GAME.groupById."+origGroupId+".label", " to ", "$GAME.groupById."+destGroupId+".label", "."],
          ["MOVE_STACK", origStackId, destGroupId, dest.index, {"allowFlip": allowFlip}],
          ["COND",
            ["VAR", `$GAME.stackById/${origStackId}`],
            [
              ["SET", `/stackById/${origStackId}/left`, stackLeft],
              ["SET", `/stackById/${origStackId}/top`, stackTop]
            ]
          ]
        ])
        dispatch(setGroupById(newGroupById));
      }
    }

  }

  return(

      <ArcherContainer 
        className="h-full w-full" 
        strokeColor="rgba(255,0,0,0.6)" 
        strokeWidth="15"
        svgContainerStyle={{ 
          zIndex: 2e3,
        }} 
        endShape={{
          arrow: {
            arrowLength: 1,
            arrowThickness: 2,
          }
        }}>
      <DragDropContext onDragEnd={onDragEnd} onBeforeDragStart={onBeforeDragStart}>
        <Table addDroppableRef={addDroppableRef}/>
      </DragDropContext>
    </ArcherContainer>
  )
});