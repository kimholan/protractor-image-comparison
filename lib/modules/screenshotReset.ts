import hideWindowScrollbars from "../client-side-scripts/hideWindowScrollbars";
import disableCssAnimations from "../client-side-scripts/disableCssAnimations";

export default async function screenshotReset(
    executor: Function
){
    // show scrollbars back again
    await executor(hideWindowScrollbars, false);
}