moment.locale('de');

angular
  .module('booking', ['ngTouch', 'booking.calendar'])
  .constant('sheetUrl', '<Google Drive Sheet Url>')

  .controller('MainController', ['$scope', function ($scope) {
    this.selection = {};
    this.validation = {};

    this.selectDay = day => {
      if (day.booking) {
        const startDate = this.selection.start != null ? this.selection.start.date : null;
        const isArrivalOfBooking = day.booking.start.isSame(day.date, 'day');
        const isDepartureOfBooking = day.booking.end.isSame(day.date, 'day');
        const isStartBeforeBooking = day.booking.start.isAfter(startDate);
        const isStartAfterBooking = day.booking.end.isBefore(startDate);

        if (!isArrivalOfBooking && !isDepartureOfBooking) {
          this.selection.booking = this.selection.booking == day.booking ? null : day.booking;
          return;
        }

        //if (!((isArrivalOfBooking && isStartBeforeBooking) || (isDepartureOfBooking && isStartAfterBooking) || (isDepartureOfBooking && startDate==null))) {
        //}
      }

      if (this.selection.start == null || this.selection.end != null) {
        this.selection.start = this.selection.end != null && this.selection.start.date.isSame(day.date, 'day') ? null : day;
        this.selection.end = null;
      }
      else if (day.date.isSame(this.selection.start.date, 'day')) {
        this.selection.start = null;
      }
      else if (day.date.isBefore(this.selection.start.date)) {
        this.selection.end = this.selection.start;
        this.selection.start = day;
      }
      else {
        this.selection.end = day;
      }
    };

  }])

  .directive('squarespaceConnector', ['$timeout', function ($timeout) {
    return {
      restricted: 'E',
      scope: {
        start: '=',
        end: '=',
        validation: '='
      },
      link: function (scope) {

        var $start = $('[name=SQF_START]');
        var $end = $('[name=SQF_END]');
        var $button = $(':submit');
        var $message = $('.date-validation');

        $button.click(e => {
          const invalidStart = scope.start == null;
          const invalidEnd = scope.end == null;
          if (invalidStart || invalidEnd) {

            $timeout(() => {
              scope.validation.invalidStart = invalidStart;
              scope.validation.invalidEnd = invalidEnd;
            });

            e.preventDefault();
            $message.show();
            return;
          }
          $message.hide();
          $timeout(() => {
            scope.validation.success = true;
          });
        });

        scope.$watch('start', function () {
          $start.val(scope.start ? scope.start.format('DD/MM/YYYY') : '');
        });

        scope.$watch('end', function () {
          $end.val(scope.end ? scope.end.format('DD/MM/YYYY') : '');
        });
      }
    }
  }]);
