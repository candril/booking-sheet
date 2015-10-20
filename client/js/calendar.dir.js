(function () {
  "use strict";

  angular
    .module('booking.calendar', [])
    .factory('Calendar', ['$log', '$timeout', 'sheetUrl', function ($log, $timeout, sheetUrl) {

      var Weekday = {
        SUNDAY: 0,
        MONDAY: 1,
        SATURDAY: 6
      };

      var State = {
        Free: 1,
        Arrival: 2,
        Departure: 4,
        Booked: 8
      };

      class Day {
        constructor(date, offset) {
          this.date = date;
          this.isOffset = !!offset;
          this.state = State.Free;
          this.isWeekend = date.day() === Weekday.SATURDAY || date.day() === Weekday.SUNDAY;
          this.booking = null;
        }

        _hasState(state) {
          return (this.state & state) === state;
        }

        isBooked() {
          return this._hasState(State.Booked);
        }

        isArrival() {
          return this._hasState(State.Arrival);
        }

        isDeparture() {
          return this._hasState(State.Departure);
        }
      }

      class Calendar {
        constructor() {
          this.dayMap = {};
          this.months = [];
          this.days = [];
          let me = this;
          Tabletop.init( { key: sheetUrl,
            callback(data) {
              $timeout(() => me.setBookings(data));
            },
            simpleSheet: true
          });
        }

        _ensureDay(date) {
          var key = date.format('YYYYMMDD');

          var day = this.dayMap[key];
          if (!day) {
            this.dayMap[key] = day = new Day(date);
          }
          return day;
        }

        _parseDate(date) {
          return moment(date, 'DD/MM/YYYY');
        }

        getDay(date) {
          return this._ensureDay(date);
        }

        setView(start, end) {
          this.months = [];
          this.days = [];

          do {
            var month = {
              date: start.clone(),
              weeks: []
            };

            this.months.push(month);
            var week = null;

            for (var d = 1; d <= 31 ; d++) {

              var date = month.date.clone().date(d);

              if (d === 1) {
                month.weeks.push(week = { days: [] });
                for (var offsetLeft = date.day() === Weekday.SUNDAY ? -6 : 1; offsetLeft < date.day(); offsetLeft++) {
                  week.days.push(new Day(date.clone().day(offsetLeft), true));
                }
              }
              else if (!week || date.day() === Weekday.MONDAY) {
                month.weeks.push(week = { days: [] });
              }

              var day = this._ensureDay(date);
              week.days.push(day);
              this.days.push(day);

              if (date.day() !== Weekday.SUNDAY && date.clone().date(d + 1).date() === 1) {

                for (var offsetRight = date.day() + 1; offsetRight <= 7; offsetRight++) {
                  week.days.push(new Day(date.clone().day(offsetRight), true));
                }

                break;
              }
            }
          }
          while (start.add(1, 'months').isBefore(end) || start.isSame(end, 'month'))
        }

        setBookings(bookings) {

          var self = this;
          bookings.forEach(booking => {

            if (!booking.start || !booking.end) {
              $log.warn('Invalid booking: missing start or end date.', booking);
              return;
            }

            try {
              booking.start = this._parseDate(booking.start, 'DD/MM/YYYY');
              booking.end = this._parseDate(booking.end, 'DD/MM/YYYY');

              let start = booking.start.clone();
              let end = booking.end.clone();

              if (end.isBefore(start)) {
                $log.warn('Invalid booking: end date is before start date.', booking);
                return;
              }

              var startDay = self._ensureDay(start.clone());
              startDay.state |= State.Arrival;
              startDay.booking = booking;

              var endDay = self._ensureDay(end.clone());
              endDay.state |= State.Departure;
              endDay.booking = booking;

              while (!start.add(1, 'day').isSame(end)) {
                let day = self._ensureDay(start.clone());
                day.state |= State.Booked;
                day.booking = booking;
              }

            }
            catch (error) {
              $log.error('Failed to load booking.', booking, error);
            }

          });

        }
      }

      return new Calendar();
    }])


    .controller('BookingController', ['$timeout', '$scope', 'Calendar', function ($timeout, $scope, Calendar) {
      $scope.currentMonth = moment();
      $scope.calendar = Calendar;

      $scope.moveView = function (delta) {
        $scope.currentMonth = $scope.currentMonth.add(delta, 'month');

        var start = moment($scope.currentMonth).subtract(1, 'month');
        var end = moment($scope.currentMonth).add(1, 'month');

        $scope.calendar.setView(start, end);
      };

      $scope.moveView(0);

      $scope.selectDay = function (day) {
        if (!day.isOffset && angular.isFunction($scope.onSelect)) {
          $scope.onSelect({day});
        }
      };

      $scope.isInRange = function (day) {
        const start = $scope.selection.start;
        const end = $scope.selection.end;
        if (!start || !end) {
          return false;
        }
        return day.date.isAfter(start.date, 'day') && day.date.isBefore(end.date, 'day');
      }

    }])

    .directive('bookingCalendar', function () {
      return {
        restrict: 'E',
        scope: {
          spreadsheetUrl: '@',
          selection: '=',
          onSelect: '&'
        },
        controller: 'BookingController',
        templateUrl: 'calendar.tpl.html'
      };
    })
})();