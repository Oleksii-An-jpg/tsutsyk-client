'use client';
import {FC} from "react";
import {IconButton, Popover, Portal, Text} from "@chakra-ui/react";
import {BiDownload} from "react-icons/bi";
import {useInstallPrompt} from "@/app/_lib/useInstallPrompt";

const InstallPrompt: FC = () => {
    const {phase, manual, promptInstall} = useInstallPrompt();

    // Nothing to offer: already installed, a browser that will not install at
    // all, or one that has not yet said it would. Unlike the bell — which has
    // a disabled state worth explaining — an install button that can never
    // install is a control with nothing behind it, so it is not rendered.
    if (phase === "checking" || phase === "installed" || phase === "unavailable") {
        return null;
    }

    const button = (
        <IconButton
            title={manual ? "Як встановити застосунок" : "Встановити застосунок"}
            data-tour="install-app"
            loading={phase === "working"}
            onClick={manual ? undefined : promptInstall}
            colorPalette="teal"
        >
            <BiDownload/>
        </IconButton>
    );

    if (!manual) return button;

    // iOS keeps installing to itself: there is no prompt to fire, and the
    // share sheet is not somewhere a page can open. All the button can do is
    // point at it — which is the whole reason it says "how" rather than doing.
    return (
        <Popover.Root positioning={{placement: "left"}}>
            <Popover.Trigger asChild>{button}</Popover.Trigger>
            <Portal>
                <Popover.Positioner>
                    <Popover.Content>
                        <Popover.Arrow/>
                        <Popover.Body>
                            <Popover.Title fontWeight="medium">
                                На початковий екран 🐾
                            </Popover.Title>
                            <Text mt="2" fontSize="sm">
                                Тисни «Поділитися» ⎋ унизу екрана, а тоді «На початковий
                                екран» ➕.
                            </Text>
                            <Text mt="2" fontSize="xs" color="fg.muted">
                                iPhone надсилає push-сповіщення лише встановленим
                                застосункам, тож без цього дзвіночок мовчатиме.
                            </Text>
                        </Popover.Body>
                    </Popover.Content>
                </Popover.Positioner>
            </Portal>
        </Popover.Root>
    );
};

export default InstallPrompt;
