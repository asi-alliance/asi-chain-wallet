import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { StorageProvider } from "services/storage";

const root = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement,
);

const renderApp = () => {
    root.render(
        <React.StrictMode>
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </React.StrictMode>,
    );
};

StorageProvider.init()
    .then(() => {
        renderApp();
    })
    .catch((err) => {
        console.error("[index] StorageProvider.init failed:", err);
        renderApp();
    });

// Register service worker for PWA functionality
if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/service-worker.js")
            .then((registration) => {
                console.info(
                    "ServiceWorker registration successful:",
                    registration.scope,
                );
                setInterval(() => {
                    registration.update();
                }, 60000); // Check every minute
            })
            .catch((err) => {
                console.error("ServiceWorker registration failed:", err);
            });
    });
} else if ("serviceWorker" in navigator) {
    navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
            registrations.forEach((registration) => {
                registration.unregister();
            });
        })
        .catch((err) => {
            console.error("ServiceWorker unregister failed:", err);
        });

    if ("caches" in window) {
        caches
            .keys()
            .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
            .catch((err) => {
                console.error("Cache cleanup failed:", err);
            });
    }
}
