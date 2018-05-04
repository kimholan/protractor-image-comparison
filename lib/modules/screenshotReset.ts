import hideWindowScrollbars from "../scripts/hideWindowScrollbars";
import disableCssAnimations from "../scripts/disableCssAnimations";

export default async function screenshotReset(
    executor: Function
){
    // show scrollbars back again
    await executor(hideWindowScrollbars, false);
}