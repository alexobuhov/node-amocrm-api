const _ = require('lodash');
const assert = require('assert');
const ApiClient = require('apiapi');
const request = require('axios');
const Promise = require('bluebird');

const REQUEST_DELAY = 1100;

//Delay request for ~1sec
function delayedRequest () {
	const args = arguments;
	return new Promise(function (resolve, reject) {
		setTimeout(function callRequest () {
			return request.apply(request, args)
				.then(resolve)
				.catch(reject);
		}, REQUEST_DELAY);
	});
}

module.exports = function buildClient (baseUrl) {
	assert(typeof baseUrl === 'string', 'baseUrl must be string');

	const client = new ApiClient({
		baseUrl: baseUrl,
		methods: {
			auth: 'post /private/api/auth.php?type=json',

			getCustomFieldsLeads: 'get /api/v4/leads/custom_fields',
			getCustomFieldsContacts: 'get /api/v4/contacts/custom_fields',
			getPipelines: 'get /api/v4/leads/pipelines',
			getUsers: 'get /api/v4/users',

			getAccessToken: 'post /oauth2/access_token',
			refreshAccessToken: 'post /oauth2/access_token',

			createContact: 'post /api/v4/contacts',
			createLead: 'post /api/v4/leads',
			setLinks: 'post /api/v4/leads/link',
			createNote: 'post /api/v4/leads/notes',
		},

		transformRequest: {
			createContact: prepareRequest,
			createLead: prepareRequest,
			setLinks: prepareRequest,
			createNote: prepareRequest,

			getAccessToken: prepareGetAccessToken,
			refreshAccessToken: prepareRefreshAccessToken,
		},
		transformResponse: {
			auth: storeAuth,
			getCustomFieldsLeads: parseGetCustomFieldsLeads,
			getCustomFieldsContacts: parseGetCustomFieldsContacts,
			getPipelines: parseGetPipelines,
			getUsers: parseGetUsers,

			getAccessToken: parseResponse,
			refreshAccessToken: parseResponse,

			createLead: parseCreateLead,
			createContact: parseCreateContact,
			setLinks: parseSetLinks,
			createNote: parseCreateNote,
		}
	});

	client.request = delayedRequest;

	return client;
};

function storeAuth(res) {
	const cookies = res.headers['set-cookie'];

	if (!cookies) {
		throw new Error('AmoCRM auth failed');
	}

	this.headers.Cookie = cookies.map(parseCookie).join('; ');
	return res.data;

	function parseCookie (cookieHeader) {
		return cookieHeader.split(';')[0];
	}
}

function prepareRequest(params, requestBody, opts) {
	requestBody = _.pickBy(params, (value) => !_.isNull(value));
	return [params, [requestBody], opts];
}

function parseResponse(res) {
	assert(res.data && res.status === 200, 'Response not parse due to some error');
	return res.data;
}

function prepareGetAccessToken(params, requestBody, opts) {
	requestBody = _.assign({}, params, {'grant_type': 'authorization_code'});
	return [params, requestBody, opts];
}
function prepareRefreshAccessToken(params, requestBody, opts) {
	requestBody = _.assign({}, params, {'grant_type': 'refresh_token'});
	return [params, requestBody, opts];
}

function parseCreateContact(res) {
	assert(res.data._embedded.contacts.length && res.status === 200, 'Contact is not created due to some error');
	return res.data._embedded.contacts[0];
}

function parseCreateLead(res) {
	assert(res.data._embedded.leads.length && res.status === 200, 'Lead is not added due to some error');
	return res.data._embedded.leads[0];
}

function parseCreateNote(res) {
	assert(res.data._embedded.notes.length && res.status === 200, 'Tags are not added due to some error');
	return res.data._embedded.notes;
}

function parseSetLinks(res) {
	assert(res.data._embedded.links.length && res.status === 200, 'Link is not added due to some error');
	return res.data._embedded.links;
}

function parseGetCustomFieldsLeads(res) {
	assert(res.data._embedded.custom_fields && res.status === 200, 'Get Custom Fields Leads not parse due to some error');
	return res.data._embedded.custom_fields;
}
function parseGetCustomFieldsContacts(res) {
	assert(res.data._embedded.custom_fields && res.status === 200, 'Get Custom Fields Contacts not parse due to some error');
	return res.data._embedded.custom_fields;
}
function parseGetPipelines(res) {
	assert(res.data._embedded.pipelines && res.status === 200, 'Get Pipelines not parse due to some error');
	return res.data._embedded.pipelines;
}
function parseGetUsers(res) {
	assert(res.data._embedded.users && res.status === 200, 'Get Users not parse due to some error');
	return res.data._embedded.users;
}
