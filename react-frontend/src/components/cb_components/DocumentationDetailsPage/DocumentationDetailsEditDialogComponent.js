import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import client from '../../../services/restClient';
import _ from 'lodash';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import moment from 'moment';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';

const getSchemaValidationErrorsStrings = (errorObj) => {
    let errMsg = {};
    for (const key in errorObj.errors) {
        if (Object.hasOwnProperty.call(errorObj.errors, key)) {
            const element = errorObj.errors[key];
            if (element?.message) {
                errMsg.push(element.message);
            }
        }
    }
    return errMsg.length ? errMsg : errorObj.message ? errorObj.message : null;
};

const DocumentationDetailsCreateDialogComponent = (props) => {
    const [_entity, set_entity] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const urlParams = useParams();
    const [documentationFile, setDocumentationFile] = useState([]);

    useEffect(() => {
        set_entity(props.entity);
    }, [props.entity, props.show]);

    useEffect(() => {
        //on mount documentStorages
        client
            .service('documentStorages')
            .find({ query: { $limit: 10000, $sort: { createdAt: -1 }, _id: urlParams.singleDocumentStoragesId } })
            .then((res) => {
                setDocumentationFile(
                    res.data.map((e) => {
                        return { name: e['name'], value: e._id };
                    })
                );
            })
            .catch((error) => {
                console.log({ error });
                props.alert({ title: 'DocumentStorages', type: 'error', message: error.message || 'Failed get documentStorages' });
            });
    }, []);

    const onSave = async () => {
        let _data = {
            fileName: _entity?.fileName,
            documentationFile: _entity?.documentationFile?._id
        };

        setLoading(true);
        try {
            await client.service('documentationDetails').patch(_entity._id, _data);
            const eagerResult = await client.service('documentationDetails').find({
                query: {
                    $limit: 10000,
                    _id: { $in: [_entity._id] },
                    $populate: [
                        {
                            path: 'documentationFile',
                            service: 'documentStorages',
                            select: ['name']
                        }
                    ]
                }
            });
            props.onHide();
            props.alert({ type: 'success', title: 'Edit info', message: 'Info documentationDetails updated successfully' });
            props.onEditResult(eagerResult.data[0]);
        } catch (error) {
            console.log('error', error);
            setError(getSchemaValidationErrorsStrings(error) || 'Failed to update info');
            props.alert({ type: 'error', title: 'Edit info', message: 'Failed to update info' });
        }
        setLoading(false);
    };

    const renderFooter = () => (
        <div className="flex justify-content-end">
            <Button label="save" className="p-button-text no-focus-effect" onClick={onSave} loading={loading} />
            <Button label="close" className="p-button-text no-focus-effect p-button-secondary" onClick={props.onHide} />
        </div>
    );

    const setValByKey = (key, val) => {
        let new_entity = { ..._entity, [key]: val };
        set_entity(new_entity);
        setError({});
    };

    const documentationFileOptions = documentationFile.map((elem) => ({ name: elem.name, value: elem.value }));

    return (
        <Dialog header="Edit Documentation Details" visible={props.show} closable={false} onHide={props.onHide} modal style={{ width: '40vw' }} className="min-w-max scalein animation-ease-in-out animation-duration-1000" footer={renderFooter()} resizable={false}>
            <div className="grid p-fluid overflow-y-auto" style={{ maxWidth: '55vw' }} role="documentationDetails-edit-dialog-component">
                <div className="col-12 md:col-6 field">
                    <span className="align-items-center">
                        <label htmlFor="fileName">File Name:</label>
                        <InputText id="fileName" className="w-full mb-3 p-inputtext-sm" value={_entity?.fileName} onChange={(e) => setValByKey('fileName', e.target.value)} required />
                    </span>
                    <small className="p-error">
                        {!_.isEmpty(error['fileName']) && (
                            <p className="m-0" key="error-fileName">
                                {error['fileName']}
                            </p>
                        )}
                    </small>
                </div>
                <div className="col-12 md:col-6 field">
                    <span className="align-items-center">
                        <label htmlFor="documentationFile">Documentation File:</label>
                        <Dropdown id="documentationFile" value={_entity?.documentationFile?._id} optionLabel="name" optionValue="value" options={documentationFileOptions} onChange={(e) => setValByKey('documentationFile', { _id: e.value })} />
                    </span>
                    <small className="p-error">
                        {!_.isEmpty(error['documentationFile']) && (
                            <p className="m-0" key="error-documentationFile">
                                {error['documentationFile']}
                            </p>
                        )}
                    </small>
                </div>
                <div className="col-12">&nbsp;</div>
                <small className="p-error">
                    {Array.isArray(Object.keys(error))
                        ? Object.keys(error).map((e, i) => (
                              <p className="m-0" key={i}>
                                  {e}: {error[e]}
                              </p>
                          ))
                        : error}
                </small>
            </div>
        </Dialog>
    );
};

const mapState = (state) => {
    const { user } = state.auth;
    return { user };
};
const mapDispatch = (dispatch) => ({
    alert: (data) => dispatch.toast.alert(data)
});

export default connect(mapState, mapDispatch)(DocumentationDetailsCreateDialogComponent);
