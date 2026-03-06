import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Joyride, { STATUS } from 'react-joyride';
import { useApp } from '../context/AppContext';

export default function ProductTour() {
    const { state, dispatch } = useApp();
    const location = useLocation();
    const navigate = useNavigate();
    const [run, setRun] = useState(false);

    // Initial check: if user just signed in and hasn't seen the tour, start it
    // Or if triggered manually via state.tourActive
    useEffect(() => {
        if ((state.isAuthenticated && !state.tourCompleted) || state.tourActive) {
            setRun(true);
        } else {
            setRun(false);
        }
    }, [state.isAuthenticated, state.tourCompleted, state.tourActive]);

    const steps = [
        {
            target: '#nav-setup',
            content: 'Aquí puedes configurar los colores de tu marca y enlaces principales. ¡Destaca tu identidad!',
            disableBeacon: true,
        },
        {
            target: '#nav-products',
            content: 'En esta sección podrás subir fotos de todos tus artículos en formato 1:1, definir precios y controlar inventario.',
        },
        {
            target: '#nav-store',
            content: 'Este es el enlace principal a tu catálogo. Se ajustará dinámicamente según tus colores y plantillas elegidas.',
        },
        {
            target: '#nav-dashboard',
            content: 'Finalmente, aquí tendrás estadísticas en tiempo real: clics, vistas, y funnel de Whatsapp.',
        }
    ];

    const handleJoyrideCallback = (data) => {
        const { status, type } = data;
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);
            dispatch({ type: 'SET_TOUR_COMPLETED' });
        }
    };

    // Sólo corre si hay elementos en la pantalla. Dependemos del Navbar para anclar.
    if (!state.isAuthenticated) return null;

    return (
        <Joyride
            callback={handleJoyrideCallback}
            continuous={true}
            run={run}
            scrollToFirstStep={true}
            showProgress={true}
            showSkipButton={true}
            steps={steps}
            styles={{
                options: {
                    zIndex: 10000,
                    primaryColor: state.store.brandColor || '#6366f1',
                    backgroundColor: '#1a1a2e',
                    textColor: '#fff',
                    overlayColor: 'rgba(0, 0, 0, 0.7)',
                },
                buttonNext: {
                    borderRadius: '8px',
                    padding: '8px 16px',
                },
                buttonBack: {
                    color: '#a0a0b0',
                    marginRight: '10px'
                },
                buttonSkip: {
                    color: '#a0a0b0',
                }
            }}
            locale={{
                back: 'Atrás',
                close: 'Cerrar',
                last: 'Finalizar',
                next: 'Siguiente',
                skip: 'Omitir'
            }}
        />
    );
}
