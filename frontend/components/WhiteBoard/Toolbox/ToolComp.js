import styles from "./index.module.css";
import { COLORS, MENU_ITEMS } from "../../Constants/boardConstants";
import cx from "classnames";
import { useSelector, useDispatch } from "react-redux";
import { changeBrushSize, changeColor } from "../slice/toolboxSlice";
import { SketchPicker } from "react-color";

function ToolComp() {
  const activeMenuItem = useSelector((state) => state.menu.activeMenuItem);
  const dispatch = useDispatch();
  const showStrokeToolOption = activeMenuItem === MENU_ITEMS.PENCIL;
  const showBrushToolOption =
    activeMenuItem === MENU_ITEMS.PENCIL ||
    activeMenuItem === MENU_ITEMS.ERASER;
  const { color, size } = useSelector((state) => state.tool[activeMenuItem]);

  const updateBrushSize = (e) => {
    dispatch(changeBrushSize({ item: activeMenuItem, size: e.target.value }));
  };

  const updateColor = (newColor) => {
    dispatch(changeColor({ item: activeMenuItem, color: newColor }));
  };

  return (
    <div className={styles.toolboxContainer}>
      {/* on part  */}
      {showStrokeToolOption && (
        <div className={styles.toolItem}>
          <h1>{activeMenuItem}</h1>
          <h4 className={styles.toolText}>Stroke Color</h4>
          <div className={styles.itemContainer}>
            <SketchPicker
              color={color}
              onChange={(updatedColor) => updateColor(updatedColor.hex)}
            />
          </div>
        </div>
      )}

      {/* second part */}
      {showBrushToolOption && (
        <div className={styles.toolItem}>
          <h4 className={styles.toolText}>Range slider</h4>
          <div className={styles.itemContainer}>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={size}
              onChange={updateBrushSize}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ToolComp;
