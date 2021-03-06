'use strict';
//
// tests for the DriveService.
describe('Service: DriveService', function () {

	// load the service's module
	beforeEach(module('MyApp'));

	// instantiate service
	var $httpBackend;
	var $rootScope;
	var $q;
	var $timeout;
	var DriveService;
	var authRequestHandlerGet;
	var authRequestHandlerPost;

	// stub instances
	var success = sinon.stub();
	var failure = sinon.stub();

	beforeEach(inject(function (_$httpBackend_, _DriveService_, _$q_, _$rootScope_, _$timeout_) {
		$httpBackend = _$httpBackend_;
		DriveService = _DriveService_;
		$q = _$q_;
		$rootScope = _$rootScope_;
		$timeout = _$timeout_;
		// mock out the underlying getAccessToken to return a test string
		DriveService.getHttpService().getOauthService().getAccessToken = function () {
			return 'testaccesstoken'
		};
		// disable queue mode in the HttpService
		DriveService.getHttpService().isQueueMode = false;
	}));

	beforeEach(function () {
		// Set up the mock http service responses
		// backend definition common for all tests
		// this configures the backed to return specified responses in response to specified http calls
		//authRequestHandlerGet = $httpBackend.when('GET', '')
		//	.respond({kind: 'drive#file'}, {'A-Token': 'xxx'});
		//authRequestHandlerPost = $httpBackend.when('POST', '')
		//	.respond(200, {id: 'id_from_mock_httpbackend', title: 'title'});
	});

	afterEach(function () {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();

		// reset stubs
		success.reset();
		failure.reset();
	});

	it('should be instantiated', function () {
		expect(!!DriveService).toBe(true);
	});

	it('should have the correct sig', function () {
		expect(DriveService.sig).toBe('DriveService');
	});

	// test each method by first defining what we expect it to send to $http
	// and then call the method
	//it('list should call GET on the drive endpoint', function () {
	//	var filesUrl = 'https://www.googleapis.com/drive/v2/files/:id';
	//	$httpBackend.expectGET(filesUrl.replace(':id', 'foo'));
	//	DriveService.files.get({fileId: 'foo'});
	//	$httpBackend.flush();
	//});

	describe('.files.get() method', function () {

		it('should return a file object', function () {
			var id = 'foo2';
			var filesUrl = 'https://www.googleapis.com/drive/v2/files/'+id;
			$httpBackend .whenGET("") .respond({id: id} );

			var ro = DriveService.files.get({fileId: id});

			$httpBackend.flush();

			expect('a'+DriveService.lastFile.id).toBe('a'+id);
			expect('b'+ro.data.id).toBe('b'+id);
		});

		it('should return some media when alt="media"', function () {
			var id = 'foom';
			var media = 'some media'
			var filesUrl = 'https://www.googleapis.com/drive/v2/files/'+id;
			$httpBackend .whenGET("") .respond(media);

			var ro = DriveService.files.get({fileId: id, alt:'media'});

			$httpBackend.flush();

			expect(ro.data.media).toBe(media);
		});

	});

	// it('insert should return a file object', function () {
	// 	var id = 'fooi';
	// 	var filesUrl = 'https://www.googleapis.com/drive/v2/files';
	// 	$httpBackend .whenPOST("") .respond({id: id} );
	//
	// 	var ro = DriveService.files.insert({title: 'title-'+id});
	// 	$httpBackend.flush();
	//
	// 	expect(DriveService.lastFile.id).toBe(id);
	// 	expect(ro.data.id).toBe(id);
	// });

	describe('.files.insert() method', function () {
		var id = 'fooi';
		var filesUrl = 'https://www.googleapis.com/drive/v2/files';

		beforeEach(function () {
			$httpBackend .whenPOST("") .respond({id: id} );
		});

		it('should return a file object', function () {
			var ro = DriveService.files.insert({title: 'title-'+id});
			$httpBackend.flush();

			ro.promise
				.then(success, failure)
				.finally(function() {
					expect(success).toHaveBeenCalled();
					expect(failure).not.toHaveBeenCalled();
					expect(DriveService.lastFile.id).toBe(id);
					expect(ro.data.id).toBe(id);
				});
		});

		it('should fail when uploadType="resumable" with D136 (no resumable yet)', function () {
			var ro = DriveService.files.insert({title: 'title-'+id}, {uploadType:'resumable'}, 'notb64');
			ro.promise
				.then(success, failure)
				.finally(function() {
					expect(success).not.toHaveBeenCalled();
					expect(failure).toHaveBeenCalledWithMatch(/D136/);
				});
		});

		it('should fail when uploadType="multipart" with D148 (no mime type)', function () {
			var ro = DriveService.files.insert({title: 'title-'+id}, {uploadType:'multipart'}, 'Zm9v');
			ro.promise
				.then(success, failure)
				.finally(function() {
					expect(success).not.toHaveBeenCalled();
					expect(failure).toHaveBeenCalledWithMatch(/D148/);
				});
		});

		it('should fail when uploadType="media" with D148 (no mime type)', function () {
			var ro = DriveService.files.insert({title: 'title-'+id}, {uploadType:'media'}, 'Zm9v');
			ro.promise
				.then(success, failure)
				.finally(function() {
					expect(success).not.toHaveBeenCalled();
					expect(failure).toHaveBeenCalledWithMatch(/D148/);
				});
		});

	});

	describe('.files.list() method', function () {

		it('should return a file array', function () {
			var id = 'fooi';
			var filesUrl = 'https://www.googleapis.com/drive/v2/files';
			$httpBackend .whenGET("") .respond({items:[{id:'one'},{id:'two'}]} );

			var ro = DriveService.files.list();
			$httpBackend.flush();

			ro.promise
				.then(success, failure)
				.finally(function() {
					expect(success).toHaveBeenCalled();
					expect(failure).not.toHaveBeenCalled();
					expect(ro.data.length).toBe(2);
				});
		});

		// NOTE:
		// I assume this test is supposed to fail, but it succeded in the
		// in the original code, so I refactored it with the same logic.
		//
		// TODO: Correct test for missing nextPageToken
		it('should fail when missing nextPageToken', function () {
			$httpBackend .whenGET("") .respond({items:[{id:'one'},{id:'two'}]} );

			var ro = DriveService.files.list({fields: 'foo'});
			$httpBackend.flush();

			ro.promise
				.then(success, failure)
				.finally(function() {
					expect(success).toHaveBeenCalled();
					expect(failure).not.toHaveBeenCalled();
				});
		});

	});

	describe('.files.update() method', function () {

		it('should return a file object ', function () {
			var id = 'foot';
			var filesUrl = 'https://www.googleapis.com/drive/v2/files/:id';
			$httpBackend .whenPUT("") .respond({id: id } );

			var ro = DriveService.files.update({title:'foo'}, {fileId: id});
			$httpBackend.flush();

			ro.promise
				.then(success, failure)
				.finally(function() {
					expect(success).toHaveBeenCalled();
					expect(failure).not.toHaveBeenCalled();
					expect(DriveService.lastFile.id).toBe(id);
					expect(ro.data.id).toBe(id);
				});
		});

		it('should fail when missing fileId', function () {
			var ro = DriveService.files.update({title: 'title-'});
			ro.promise
				.then(success, failure)
				.finally(function() {
					expect(success).not.toHaveBeenCalled();
					expect(failure).toHaveBeenCalledWithMatch(/D193/);
				});
		});

	});

	describe('.files.patch() method', function () {

		it('should return a file object ', function () {
			var id = 'foot';
			var filesUrl = 'https://www.googleapis.com/drive/v2/files/:id';
			$httpBackend .whenPATCH("") .respond({id: id } );

			var ro = DriveService.files.patch({fileId: id});
			$httpBackend.flush();

			ro.promise
				.then(success, failure)
				.finally(function() {
					expect(success).toHaveBeenCalled();
					expect(failure).not.toHaveBeenCalled();
					expect(DriveService.lastFile.id).toBe(id);
					expect(ro.data.id).toBe(id);
				});
		});

		it('should fail when missing fileId', function () {
			var ro = DriveService.files.patch({title: 'title-'});
			ro.promise
				.then(success, failure)
				.finally(function() {
					expect(success).not.toHaveBeenCalled();
					expect(failure).toHaveBeenCalledWithMatch(/D230/);
				});
		});

	});

	describe('.files.trash() method', function () {

		it('should return a file object with labels.trashed=true', function () {
			var id = 'foot';
			var filesUrl = 'https://www.googleapis.com/drive/v2/files/:id/trash';
			$httpBackend .whenPOST("") .respond({id: id, labels:{trashed: true}} );

			var ro = DriveService.files.trash({fileId: id});
			$httpBackend.flush();

			ro.promise
				.then(success, failure)
				.finally(function() {
					expect(success).toHaveBeenCalled();
					expect(failure).not.toHaveBeenCalled();
					expect(DriveService.lastFile.id).toBe(id);
					expect(ro.data.id).toBe(id);
					expect(ro.data.labels.trashed).toBeTruthy();
				});
		});

		it('should fail when missing fileId', function () {
			var ro = DriveService.files.trash({title: 'title-'});
			ro.promise
				.then(success, failure)
				.finally(function() {
					expect(success).not.toHaveBeenCalled();
					expect(failure).toHaveBeenCalledWithMatch(/D225/);
				});
		});

	});

	describe('.files.untrash() method', function () {

		it('should return a file object with labels.trashed=false', function () {
			var id = 'foot';
			var filesUrl = 'https://www.googleapis.com/drive/v2/files/:id/trash';
			$httpBackend .whenPOST("") .respond({id: id, labels:{trashed: false}} );

			var ro = DriveService.files.untrash({fileId: id});
			$httpBackend.flush();

			ro.promise
				.then(success, failure)
				.finally(function() {
					expect(success).toHaveBeenCalled();
					expect(failure).not.toHaveBeenCalled();
					expect(DriveService.lastFile.id).toBe(id);
					expect(ro.data.id).toBe(id);
					expect(ro.data.labels.trashed).toBeFalsy();
				});
		});

		it('should fail when missing fileId', function () {
			var ro = DriveService.files.untrash({title: 'title-'});
			ro.promise
				.then(success, failure)
				.finally(function() {
					expect(success).not.toHaveBeenCalled();
					expect(failure).toHaveBeenCalledWithMatch(/D251/);
				});
		});

	});

	describe('.files.del() method', function () {

		it('should fail when missing fileId', function () {
			var ro = DriveService.files.del({title: 'title-'});
			ro.promise
				.then(success, failure)
				.finally(function() {
					expect(success).not.toHaveBeenCalled();
					expect(failure).toHaveBeenCalledWithMatch(/D222/);
				});
		});

	});

	describe('.files.touch() method', function () {

		it('should return a file object', function () {
			var id = 'foot';
			var filesUrl = 'https://www.googleapis.com/drive/v2/files/:id/touch';
			$httpBackend .whenPOST("") .respond({id: id, labels:{trashed: true}} );

			var ro = DriveService.files.touch({fileId: id});
			$httpBackend.flush();

			ro.promise
				.then(success, failure)
				.finally(function() {
					expect(success).toHaveBeenCalled();
					expect(failure).not.toHaveBeenCalled();
					expect(DriveService.lastFile.id).toBe(id);
					expect(ro.data.id).toBe(id);
				});
		});

		it('should fail when missing fileId', function () {
			var ro = DriveService.files.touch({title: 'title-'});
			ro.promise
				.then(success, failure)
				.finally(function() {
					expect(success).not.toHaveBeenCalled();
					expect(failure).toHaveBeenCalledWithMatch(/D329/);
				});
		});

	});

	describe('.files.watch() method', function () {

		it('should fail when missing fileId', function () {
			var ro = DriveService.files.watch({title: 'title-'});
			ro.promise
				.then(success, failure)
				.finally(function() {
					expect(success).not.toHaveBeenCalled();
					expect(failure).toHaveBeenCalledWithMatch(/D302/);
				});
		});

	});

	//it('watch should return a file object', function () {
	//	var id = 'foot';
	//	var filesUrl = 'https://www.googleapis.com/drive/v2/files/:id/watch';
	//	$httpBackend .whenPOST("") .respond({id: id, labels:{trashed: true}} );
	//
	//	var ro = DriveService.files.watch({id: id});
	//	$httpBackend.flush();
	//
	//	expect(DriveService.lastFile.id).toBe(id);
	//	expect(ro.data.id).toBe(id);
	//});

	/*
	 it('insert should call POST on the tasks endpoint', function() {
	 console.log("test insert");
	 $httpBackend.expectPOST("http://localhost:8080/tasks/v1/lists/MDM4NjIwODI0NzAwNDQwMjQ2MjU6OTEzMzE4NTkxOjA/tasks");
	 DriveService.insert({title:'foo'});
	 $httpBackend.flush();
	 });
	 */

});
