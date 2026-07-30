import {useBoolean} from "usehooks-ts";
import {useEffect} from "react";

const InstallPrompt = () => {
    const { value: iOS, setValue } = useBoolean(false);
    const { value: standalone, setValue: setStandalone } = useBoolean(false);

    useEffect(() => {
        setValue(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
        )

        setStandalone(window.matchMedia('(display-mode: standalone)').matches)
    }, [])

    if (standalone) {
        return null // Don't show install button if already installed
    }

    return (
        <div>
            <h3>Install App</h3>
            <button>Add to Home Screen</button>
            {iOS && (
                <p>
                    To install this app on your iOS device, tap the share button
                    <span role="img" aria-label="share icon">
            {' '}
                        ⎋{' '}
          </span>
                    and then &#34;Add to Home Screen&#34;
                    <span role="img" aria-label="plus icon">
            {' '}
                        ➕{' '}
          </span>
                    .
                </p>
            )}
        </div>
    )
}

export default InstallPrompt;
