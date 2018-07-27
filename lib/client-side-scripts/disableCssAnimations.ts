export default function disableCssAnimations(disableCssAnimations: boolean): any {

    if(disableCssAnimations) {
        const head = document.head || document.getElementsByTagName('head')[0];
        const style = document.createElement('style');

        style.type = 'text/css';
        style.appendChild(
            document.createTextNode(`* { 
        -webkit-transition-duration: 0s !important;
        transition-duration: 0s !important;
        -webkit-animation-duration: 0s !important;
        animation-duration: 0s !important;
        transition: none !important;
        }`
            )
        );

        head.appendChild(style);
    }
}