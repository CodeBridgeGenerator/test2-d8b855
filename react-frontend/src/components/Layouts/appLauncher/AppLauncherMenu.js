import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { useAppLauncher } from './AppLauncherProvider';
import { APP_LAUNCHER_ICON_OPTIONS, isExternalAppLink } from './appLauncherApps';

const AppsGridIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="5" cy="5" r="2" />
        <circle cx="12" cy="5" r="2" />
        <circle cx="19" cy="5" r="2" />
        <circle cx="5" cy="12" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="19" cy="12" r="2" />
        <circle cx="5" cy="19" r="2" />
        <circle cx="12" cy="19" r="2" />
        <circle cx="19" cy="19" r="2" />
    </svg>
);

const emptyForm = {
    label: '',
    to: '',
    iconClass: APP_LAUNCHER_ICON_OPTIONS[0]
};

const AppLauncherMenu = () => {
    const panelRef = useRef(null);
    const dragIndex = useRef(null);
    const navigate = useNavigate();
    const { apps, selectedApp, setSelectedApp, addCustomApp, removeCustomApp, reorderApps } = useAppLauncher();
    const [isEditing, setIsEditing] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [formError, setFormError] = useState('');
    const [dragOverIndex, setDragOverIndex] = useState(null);

    const closePanel = () => panelRef.current?.hide();

    const resetForm = () => {
        setIsAdding(false);
        setForm(emptyForm);
        setFormError('');
    };

    const resetPanel = () => {
        resetForm();
        setIsEditing(false);
        setDragOverIndex(null);
        dragIndex.current = null;
    };

    const openProduct = (app) => {
        if (!app?.to) return;

        if (app.custom || isExternalAppLink(app.to)) {
            window.open(app.to, '_blank', 'noopener,noreferrer');
            return;
        }

        setSelectedApp(app.key);
        navigate(app.to);
    };

    const selectApp = (app) => {
        if (isEditing) return;
        openProduct(app);
        resetPanel();
        closePanel();
    };

    const saveProduct = (event) => {
        event.preventDefault();

        const nextApp = addCustomApp(form);
        if (!nextApp) {
            setFormError('Enter a product name and link.');
            return;
        }

        resetForm();
        setIsEditing(true);
    };

    const onDragStart = (event, index) => {
        if (!isEditing) return;
        dragIndex.current = index;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(index));
    };

    const onDragOver = (event, index) => {
        if (!isEditing) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };

    const onDrop = (event, index) => {
        if (!isEditing) return;
        event.preventDefault();
        const fromIndex = dragIndex.current;
        dragIndex.current = null;
        setDragOverIndex(null);
        if (fromIndex === null || fromIndex === index) return;
        reorderApps(fromIndex, index);
    };

    const onDragEnd = () => {
        dragIndex.current = null;
        setDragOverIndex(null);
    };

    return (
        <div className="app-launcher">
            <button type="button" className="p-link layout-topbar-icon app-launcher-button" onClick={(event) => panelRef.current?.toggle(event)} aria-label="Open apps" title="Apps">
                <AppsGridIcon />
            </button>

            <OverlayPanel ref={panelRef} className="app-launcher-panel" dismissable showCloseIcon={false} appendTo={typeof document !== 'undefined' ? document.body : null} onHide={resetPanel}>
                {isAdding ? (
                    <form className="app-launcher-form" onSubmit={saveProduct}>
                        <div className="app-launcher-form-header">
                            <button type="button" className="app-launcher-back" onClick={resetForm}>
                                <i className="pi pi-arrow-left" />
                            </button>
                            <strong>Add product</strong>
                        </div>

                        <label className="app-launcher-field">
                            <span>Name</span>
                            <InputText
                                value={form.label}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        label: event.target.value
                                    }))
                                }
                                placeholder="Product name"
                                autoFocus
                            />
                        </label>

                        <label className="app-launcher-field">
                            <span>Link</span>
                            <InputText
                                value={form.to}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        to: event.target.value
                                    }))
                                }
                                placeholder="https://example.com"
                            />
                        </label>

                        <div className="app-launcher-field">
                            <span>Icon</span>
                            <div className="app-launcher-icon-picker">
                                {APP_LAUNCHER_ICON_OPTIONS.map((iconClass) => (
                                    <button
                                        type="button"
                                        key={iconClass}
                                        className={classNames('app-launcher-icon-choice', {
                                            active: form.iconClass === iconClass
                                        })}
                                        onClick={() => setForm((current) => ({ ...current, iconClass }))}
                                        title={iconClass.replace('pi pi-', '')}
                                    >
                                        <i className={iconClass} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {formError ? <p className="app-launcher-form-error">{formError}</p> : null}

                        <div className="app-launcher-form-actions">
                            <button type="button" onClick={resetForm}>
                                Cancel
                            </button>
                            <button type="submit">Add</button>
                        </div>
                    </form>
                ) : (
                    <>
                        <div className="app-launcher-toolbar">
                            <span className="app-launcher-toolbar-title">{isEditing ? 'Edit products' : 'Apps'}</span>
                            <button type="button" className="app-launcher-edit-toggle" onClick={() => setIsEditing((current) => !current)}>
                                {isEditing ? 'Done' : 'Edit'}
                            </button>
                        </div>
                        {isEditing ? <p className="app-launcher-hint">Drag to rearrange. Add or delete custom products here.</p> : null}
                        <div className="app-launcher-grid-wrap">
                            <div
                                className={classNames('app-launcher-grid', {
                                    editing: isEditing
                                })}
                            >
                                {apps.map((app, index) => (
                                    <div
                                        key={app.key}
                                        className={classNames('app-launcher-item-wrap', {
                                            active: selectedApp === app.key && !app.custom,
                                            dragging: dragOverIndex === index
                                        })}
                                        draggable={isEditing}
                                        onDragStart={(event) => onDragStart(event, index)}
                                        onDragOver={(event) => onDragOver(event, index)}
                                        onDrop={(event) => onDrop(event, index)}
                                        onDragEnd={onDragEnd}
                                    >
                                        <button
                                            type="button"
                                            draggable={false}
                                            className={classNames('app-launcher-item', {
                                                active: selectedApp === app.key && !app.custom
                                            })}
                                            onClick={() => selectApp(app)}
                                        >
                                            <span className="app-launcher-item-icon">
                                                <i className={app.iconClass} />
                                            </span>
                                            <span className="app-launcher-item-label">{app.label}</span>
                                        </button>
                                        {isEditing && app.custom ? (
                                            <button
                                                type="button"
                                                className="app-launcher-item-remove"
                                                aria-label={`Remove ${app.label}`}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    removeCustomApp(app.key);
                                                }}
                                            >
                                                <i className="pi pi-times" />
                                            </button>
                                        ) : null}
                                    </div>
                                ))}

                                {isEditing ? (
                                    <button type="button" className="app-launcher-item app-launcher-add" onClick={() => setIsAdding(true)}>
                                        <span className="app-launcher-item-icon app-launcher-add-icon">
                                            <i className="pi pi-plus" />
                                        </span>
                                        <span className="app-launcher-item-label">Add product</span>
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </>
                )}
            </OverlayPanel>
        </div>
    );
};

export default AppLauncherMenu;
