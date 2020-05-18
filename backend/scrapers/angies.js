const axios = require('axios');
const Lead = require('../models/Lead');

// not sure if I need this mongoose set up
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/leadminer';
console.log('Connecting DB to ', MONGODB_URI);

mongoose
	.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
	.then((x) => console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`))
	.catch((err) => console.error('Error connecting to mongo', err));

async function makePages(id, count) {
	let pages = [];
	let pageId = id;

	for (let i = 0; i <= count; i++) {
		let page = `https://member.angieslist.com/gateway/service-provider-profile/v4/service_provider/${pageId}?zipCode=11207&categoryId=77`;
		pages.push(page);
		pageId += 2;
	}

	return pages;
}

async function scrapePages(pages) {
	let results = [];

	for (let i = 0; i < pages.length; i++) {
		let res = await axios.get(pages[i], {
			headers: {
				accept: 'application/json',
				'accept-language': 'en-US,en;q=0.9',
				pragma: 'no-cache',
				'sec-fetch-dest': 'empty',
				'sec-fetch-mode': 'cors',
				'sec-fetch-site': 'same-origin',
				'x-angi-anonymousid': '215a9db8-fe8b-415a-7535-597a2fc778b8',
				'x-angi-applicationversion': '1.1.0',
				'x-angi-callerid': '79351237',
				'x-angi-callertype': 'Member',
				'x-angi-entrypointid': '34103542',
				'x-angi-marketingcloudvisitorid': '83266801249885083401588063845666855220',
				'x-angi-proxyversion': '1',
				'x-angi-requestid': 'e9c9b3a2-9486-11ea-917e-47bf8d6d0426',
				'x-angi-sourceapplication': 'member-app',
				'x-angi-taxonomyname': 'Ad Platform'
			},
			referrer: 'https://member.angieslist.com/member/store/25082296/deals?categoryId=77',
			referrerPolicy: 'no-referrer-when-downgrade',
			body: null,
			method: 'GET',
			mode: 'cors',
			credentials: 'include'
		});

		let data = {
			businessName: res.data.name,
			phoneNumber: res.data.primaryContactInfo.primaryPhoneNumber.original,
			city: res.data.primaryAddress.city.name,
			state: res.data.primaryAddress.region.abbreviation
		};

		results.push(data);
	}
	return results;
}

async function main(id, count) {
	const pages = await makePages(id, count);

	const pagesScraped = await scrapePages(pages);
	Lead.insertMany(pagesScraped);
}

main(25082300, 10);
