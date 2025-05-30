using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TeaTimeDemo.Models.DTOs
{
    /// <summary>
    /// 用於前端送單筆 HtmlSection 更新的 DTO
    /// </summary>
    public class UpdateSingleHtmlSectionDto
    {
        /// <summary>要更新的 HtmlSection.Id</summary>
        public int SectionId { get; set; }

        /// <summary>新的 HtmlPart (完整一段)</summary>
        public string HtmlPart { get; set; }
    }
}