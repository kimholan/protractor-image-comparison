export default function hideWindowScrollbars(enabled: boolean) {
    document.body.style.overflow = enabled ? '' : 'hidden';
}