import { useContext } from "react";
import BroadcastContext from "../../../contexts/BroadcastContext";
import store from "../../../store";
import { useDoActionList } from "./useDoActionList";
import { dragnActionLists } from "../functions/dragnActionLists";
import { useDispatch } from "react-redux";
import { useImportViaUrl } from "./useImportViaUrl";
import { setShowModal } from "../../store/playerUiSlice";
import { useActiveCardId } from "./useActiveCardId";
import { useSendLocalMessage } from "./useSendLocalMessage";
import { useCurrentFace } from "./useCurrentFace";
import { useCurrentSide } from "./useCurrentSide";

export const dragnHotkeys = [
    {"key": "T", "actionList": "targetCard", "label": "targetCard"},
    {"key": "Shift+A", "actionList": "triggerAutomationAbility", "label": "triggerAbility"},
    {"key": "Shift+W", "actionList": "drawArrow", "label": "startStopDrawingArrow"},
    {"key": "Escape", "actionList": "clearTargets", "label": "clearTargetsArrows"},
    {"key": "Ctrl+U", "actionList": "loadURL", "label": "loadUrl"},
    {"key": "Ctrl+L", "actionList": "loadPrebuilt", "label": "loadPrebuilt"},
    {"key": "Ctrl+S", "actionList": "saveGame", "label": "saveGame"},
    {"key": "Ctrl+Z", "actionList": "undo", "label": "undoOneAction"},
    {"key": "Ctrl+Y", "actionList": "redo", "label": "redoOneAction"},
    {"key": "ArrowLeft", "actionList": "undo", "label": "undoOneAction"},
    {"key": "ArrowRight", "actionList": "redo", "label": "redoOneAction"},
    {"key": "Shift+ArrowLeft", "actionList": "undoMany", "label": "undoManyActions"},
    {"key": "Shift+ArrowRight", "actionList": "redoMany", "label": "redoManyActions"},
    {"key": "ArrowUp", "actionList": "prevStep", "label": "moveToPreviousGameStep"},
    {"key": "ArrowDown", "actionList": "nextStep", "label": "moveToNextGameStep"}
  ]

export const dragnTouchButtons = {
    "targetCard": {
      "id": "targetCard",
      "label": "targetCard",
      "actionType": "card",
      "actionList": "targetCard"
    },
    "drawArrow": {
      "id": "drawArrow",
      "label": "drawArrow",
      "actionType": "card",
      "actionList": "drawArrow"
    },
    "clearTargets": {
      "id": "clearTargets",
      "label": "clearTargets",
      "actionType": "game",
      "actionList": "clearTargets"
    },
    "saveGame": {
      "id": "saveGame",
      "label": "saveGame",
      "actionType": "game",
      "actionList": "saveGame"
    },
    "undo": {
      "id": "undo",
      "label": "undo",
      "actionType": "game",
      "actionList": "undo"
    },
    "redo": {
      "id": "redo",
      "label": "redo",
      "actionType": "game",
      "actionList": "redo"
    },
    "undoMany": {
      "id": "undoMany",
      "label": "undoMany",
      "actionType": "game",
      "actionList": "undoMany"
    },
    "redoMany": {
      "id": "redoMany",
      "label": "redoMany",
      "actionType": "game",
      "actionList": "redoMany"
    },
    "prevStep": {
      "id": "prevStep",
      "label": "prevStep",
      "actionType": "game",
      "actionList": "prevStep"
    },
    "nextStep": {
      "id": "nextStep",
      "label": "nextStep",
      "actionType": "game",
      "actionList": "nextStep"
    }
  }
  
  export const useDoDragnHotkey = () => {
    const doActionList = useDoActionList();
    const dispatch = useDispatch();
    const importViaUrl = useImportViaUrl();
    const sendLocalMessage = useSendLocalMessage();
    const activeCardId = useActiveCardId();
    const currentSide = useCurrentSide(activeCardId);
    const currentFace = useCurrentFace(activeCardId);
    const {gameBroadcast} = useContext(BroadcastContext);
    const cardActionLists = ["targetCard", "drawArrow", "triggerAutomationAbility"];
    return (actionList) => {
      if (cardActionLists.includes(actionList) && !activeCardId) {
        sendLocalMessage(`You must hover over a card to use that hotkey.`);
        return;
      }
      switch (actionList) {
        case "loadURL":
          return importViaUrl();
        case "loadPrebuilt":
          return dispatch(setShowModal("prebuilt_deck"));
        case "targetCard":
          return doActionList(dragnActionLists.targetCard());
        case "triggerAutomationAbility":
          return doActionList(dragnActionLists.triggerAutomationAbility(currentFace?.ability, activeCardId, currentSide));
        case "saveGame":
          return gameBroadcast("game_action", {action: "save_replay", options: {player_ui: store.getState().playerUi}});
        case "clearTargets":
            return doActionList(dragnActionLists.clearTargets());
        case "undo":
            return gameBroadcast("step_through", {options: {size: "single", direction: "undo"}});
        case "redo":
            return gameBroadcast("step_through", {options: {size: "single", direction: "redo"}});
        case "undoMany":
            return gameBroadcast("step_through", {options: {size: "round", direction: "undo"}});
        case "redoMany":
            return gameBroadcast("step_through", {options: {size: "round", direction: "redo"}});
        case "prevStep": 
            return doActionList([
                ["VAR", "$STEP_ID", "$GAME.stepId"],
                ["LOG", "$ALIAS_N", " set the round step to ", "$GAME.steps.$STEP_ID.label", "."],
                ["VAR", "$OLD_STEP_INDEX", ["GET_INDEX", "$GAME.stepOrder", "$GAME.stepId"]],
                ["COND",
                  ["EQUAL", "$OLD_STEP_INDEX", 0],
                  ["DEFINE", "$NEW_STEP_INDEX", ["SUBTRACT", ["LENGTH", "$GAME.stepOrder"], 1]],
                  true,
                  ["DEFINE", "$NEW_STEP_INDEX", ["SUBTRACT", "$OLD_STEP_INDEX", 1]]
                ],
                ["VAR", "$STEP_ID", "$GAME.stepOrder.[$NEW_STEP_INDEX]"],
                ["SET", "/stepId", "$STEP_ID"]
            ])
        case "nextStep":
          return doActionList([
              ["VAR", "$STEP_ID", "$GAME.stepId"],
              ["LOG", "$ALIAS_N", " set the round step to ", "$GAME.steps.$STEP_ID.label", "."],
              ["VAR", "$OLD_STEP_INDEX", ["GET_INDEX", "$GAME.stepOrder", "$GAME.stepId"]],
              ["COND",
                ["EQUAL", "$OLD_STEP_INDEX", ["SUBTRACT", ["LENGTH", "$GAME.stepOrder"], 1]],
                ["DEFINE", "$NEW_STEP_INDEX", 0],
                true,
                ["DEFINE", "$NEW_STEP_INDEX", ["ADD", "$OLD_STEP_INDEX", 1]]
              ],
              ["VAR", "$STEP_ID", "$GAME.stepOrder.[$NEW_STEP_INDEX]"],
              ["SET", "/stepId", "$STEP_ID"]
          ])
        case "drawArrow":
            return doActionList([
                ["VAR", "$FROM_CARD_ID", "$GAME.playerData.$PLAYER_N.drawingArrowFrom"],
                ["COND",
                  ["EQUAL", "$FROM_CARD_ID", null],
                  [
                    ["LOG", "$ALIAS_N", " is drawing an arrow from ", "$ACTIVE_CARD.currentFace.name", "."],
                    ["SET", "/playerData/$PLAYER_N/drawingArrowFrom", "$ACTIVE_CARD_ID"]
                  ],
                  ["IN_LIST", "$GAME.cardById.$FROM_CARD_ID.arrows.$PLAYER_N", "$ACTIVE_CARD_ID"],
                  [
                    ["LOG", "$ALIAS_N", " removed an arrow to ", "$ACTIVE_CARD.currentFace.name", "."],
                    ["SET", "/cardById/$FROM_CARD_ID/arrows/$PLAYER_N", 
                      ["REMOVE_FROM_LIST_BY_VALUE", "$GAME.cardById.$FROM_CARD_ID.arrows.$PLAYER_N", "$ACTIVE_CARD_ID"]
                    ],
                    ["SET", "/playerData/$PLAYER_N/drawingArrowFrom", null]
                  ],
                  true,
                  [
                    ["LOG", "$ALIAS_N", " drew an arrow to ", "$ACTIVE_CARD.currentFace.name", "."],
                    ["SET", "/cardById/$FROM_CARD_ID/arrows/$PLAYER_N", ["APPEND", "$GAME.cardById.$FROM_CARD_ID.arrows.$PLAYER_N", "$ACTIVE_CARD_ID"]],
                    ["SET", "/playerData/$PLAYER_N/drawingArrowFrom", null]
                  ]
                ]
            ])
        }
    }
  }