import './styles/app.scss'; // Chemin relatif
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useApi } from './hooks/api.js';
import { useConstants } from './hooks/constants.js';
import { useUtils } from './hooks/utils.js';
import Preloader from './components/loaders/Preloader.jsx';
import DataProvider, { useData } from './providers/DataProvider.jsx';
import LanguageProvider from './providers/LanguageProvider.jsx';
import ViewportProvider from './providers/ViewportProvider.jsx';
import ThemeProvider from './providers/ThemeProvider.jsx';
import LocationProvider from './providers/LocationProvider.jsx';
import FeedbacksProvider from './providers/FeedbacksProvider.jsx';
import InputProvider from './providers/InputProvider.jsx';
import NavigationProvider from './providers/NavigationProvider.jsx';
import Portfolio from './components/Portfolio.jsx';

/** Initialization Script... **/
let container = null;
document.addEventListener('DOMContentLoaded', function (event) {
    if (container) return;

    container = document.getElementById('root');
    createRoot(document.getElementById('root')).render(<App />);
});

/**
 * Main app component. Wraps content with AppEssentialsWrapper and AppCapabilitiesWrapper.
 * @return {JSX.Element}
 */
const App = () => {
    return (
        <AppEssentialsWrapper>
            <AppCapabilitiesWrapper>
                <Portfolio />
            </AppCapabilitiesWrapper>
        </AppEssentialsWrapper>
    );
};

/**
 * Wraps the app with essential components for booting up.
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @return {JSX.Element}
 */
const AppEssentialsWrapper = ({ children }) => {
    const api = useApi();
    const utils = useUtils();
    const constants = useConstants();

    const [settings, setSettings] = useState();

    useEffect(() => {
        if (window.location.pathname !== utils.file.BASE_URL) {
            window.history.pushState({}, '', utils.file.BASE_URL);
        }

        utils.file.loadJSON('/data/settings.json').then(response => {
            _applyDeveloperSettings(response);
            setSettings(response);
        });

        api.analytics.reportVisit().then(() => { });
    }, []);

    const _applyDeveloperSettings = (settings) => {
        const developerSettings = settings?.developerSettings;
        const debugMode = developerSettings?.debugMode;
        const fakeEmailRequests = developerSettings?.fakeEmailRequests;
        const stayOnThePreloaderScreen = developerSettings?.stayOnThePreloaderScreen;

        if (constants.PRODUCTION_MODE) return;

        if (debugMode) {
            settings.preloaderSettings.enabled = stayOnThePreloaderScreen;
            settings.templateSettings.animatedBackground = false;
            utils.storage.setWindowVariable('suspendAnimations', true);
            utils.log.warn(
                'DataProvider',
                'Debug Mode is enabled, so transitions and animated content—such as the preloader screen, background animations, and role text typing—will be skipped. You can disable it manually on settings.json or by running the app on PROD_MODE, which disables it by default.'
            );
        }

        if (fakeEmailRequests) {
            utils.storage.setWindowVariable('fakeEmailRequests', true);
            utils.log.warn(
                'DataProvider',
                'Fake email requests are enabled. This is only for development purposes and will be disabled automatically in production.'
            );
        }

        if (stayOnThePreloaderScreen) {
            utils.storage.setWindowVariable('stayOnThePreloaderScreen', true);
            utils.log.warn(
                'DataProvider',
                'Preloader screen will be displayed indefinitely because the developer flag "stayOnThePreloaderScreen" is on. This is only for development purposes and will be disabled automatically in production.'
            );
        }
    };

    return (
        <StrictMode>
            {settings && (
                <Preloader preloaderSettings={settings['preloaderSettings']}>
                    <DataProvider settings={settings}>{children}</DataProvider>
                </Preloader>
            )}
        </StrictMode>
    );
};

/**
 * Wraps app capabilities, initialized after essential components.
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @return {JSX.Element}
 */
const AppCapabilitiesWrapper = ({ children }) => {
    const data = useData();

    const [selectedThemeId, setSelectedThemeId] = useState(null);

    const appSettings = data.getSettings();
    const appStrings = data.getStrings();
    const appSections = data.getSections();
    const appCategories = data.getCategories();

    const supportedLanguages = appSettings['supportedLanguages'];
    const supportedThemes = appSettings['supportedThemes'];
    const defaultLanguageId = appSettings['templateSettings'].defaultLanguageId;
    const defaultThemeId = appSettings['templateSettings'].defaultThemeId;
    const animatedCursorEnabled = appSettings['templateSettings'].animatedCursorEnabled;
    const showSpinnerOnThemeChange = appSettings['templateSettings'].showSpinnerOnThemeChange;

    return (
        <LanguageProvider
            supportedLanguages={supportedLanguages}
            defaultLanguageId={defaultLanguageId}
            appStrings={appStrings}
            selectedThemeId={selectedThemeId}
        >
            <ViewportProvider>
                <InputProvider>
                    <FeedbacksProvider canHaveAnimatedCursor={animatedCursorEnabled}>
                        <ThemeProvider
                            supportedThemes={supportedThemes}
                            defaultThemeId={defaultThemeId}
                            showSpinnerOnThemeChange={showSpinnerOnThemeChange}
                            onThemeChanged={setSelectedThemeId}
                        >
                            <LocationProvider sections={appSections} categories={appCategories}>
                                <NavigationProvider sections={appSections} categories={appCategories}>
                                    {children}
                                </NavigationProvider>
                            </LocationProvider>
                        </ThemeProvider>
                    </FeedbacksProvider>
                </InputProvider>
            </ViewportProvider>
        </LanguageProvider>
    );
};