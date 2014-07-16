$('#login').popover()

$(".btn-popover-container").each(function() {
    var btn = $(this).children(".popover-btn");
    var titleContainer = $(this).children(".btn-popover-title");
    var contentContainer = $(this).children(".btn-popover-content");

    var title = $(titleContainer).html();
    var content = $(contentContainer).html();

    $(btn).popover({
        html: true,
        title: title,
        content: content,
        placement: 'bottom'
    });
});