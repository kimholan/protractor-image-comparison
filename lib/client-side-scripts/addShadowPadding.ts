export default function addShadowPadding({addressBarShadowPadding, toolBarShadowPadding}: {
    addressBarShadowPadding: number,
    toolBarShadowPadding: number
}) {

    const head = document.head || document.getElementsByTagName('head')[0];
    const style = document.createElement('style');
    const paddingBottom = toolBarShadowPadding === 0 ? '' : `body{padding-bottom:${toolBarShadowPadding}px !important}`;
    const paddingTop = addressBarShadowPadding === 0 ? '' : `body{padding-top:${addressBarShadowPadding}px !important}`;

    style.type = 'text/css';
    style.appendChild(document.createTextNode(`${paddingBottom} ${paddingTop}`));

    head.appendChild(style);
}