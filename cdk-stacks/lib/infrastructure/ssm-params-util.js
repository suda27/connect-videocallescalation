"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixDummyValueString = exports.loadSSMParams = void 0;
// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
const configParams = require('../../config.params.json');
const ssm = require("@aws-cdk/aws-ssm");
exports.loadSSMParams = (scope) => {
    const params = {};
    const SSM_NOT_DEFINED = 'not-defined';
    for (const param of configParams.parameters) {
        if (param.boolean) {
            params[param.name] = (ssm.StringParameter.valueFromLookup(scope, `${configParams.hierarchy}${param.name}`).toLowerCase() === "true");
        }
        else {
            params[param.name] = ssm.StringParameter.valueFromLookup(scope, `${configParams.hierarchy}${param.name}`);
        }
    }
    return { ...params, SSM_NOT_DEFINED };
};
exports.fixDummyValueString = (value) => {
    if (value.includes('dummy-value-for-'))
        return value.replace(/\//g, '-');
    else
        return value;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3NtLXBhcmFtcy11dGlsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic3NtLXBhcmFtcy11dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDBFQUEwRTtBQUMxRSxpQ0FBaUM7QUFDakMsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUE7QUFFeEQsd0NBQXVDO0FBRTFCLFFBQUEsYUFBYSxHQUFHLENBQUMsS0FBb0IsRUFBRSxFQUFFO0lBQ3BELE1BQU0sTUFBTSxHQUFRLEVBQUUsQ0FBQTtJQUN0QixNQUFNLGVBQWUsR0FBRyxhQUFhLENBQUM7SUFDdEMsS0FBSyxNQUFNLEtBQUssSUFBSSxZQUFZLENBQUMsVUFBVSxFQUFFO1FBQzNDLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRTtZQUNqQixNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLEdBQUcsWUFBWSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxNQUFNLENBQUMsQ0FBQztTQUN0STthQUNJO1lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsR0FBRyxZQUFZLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQzNHO0tBQ0Y7SUFDRCxPQUFPLEVBQUUsR0FBRyxNQUFNLEVBQUUsZUFBZSxFQUFFLENBQUE7QUFDdkMsQ0FBQyxDQUFBO0FBRVksUUFBQSxtQkFBbUIsR0FBRyxDQUFDLEtBQWEsRUFBVSxFQUFFO0lBQzNELElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQztRQUFFLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7O1FBQ3BFLE9BQU8sS0FBSyxDQUFDO0FBQ3BCLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxIEFtYXpvbi5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vLyBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogTUlULTBcbmNvbnN0IGNvbmZpZ1BhcmFtcyA9IHJlcXVpcmUoJy4uLy4uL2NvbmZpZy5wYXJhbXMuanNvbicpXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgKiBhcyBzc20gZnJvbSAnQGF3cy1jZGsvYXdzLXNzbSdcblxuZXhwb3J0IGNvbnN0IGxvYWRTU01QYXJhbXMgPSAoc2NvcGU6IGNkay5Db25zdHJ1Y3QpID0+IHtcbiAgY29uc3QgcGFyYW1zOiBhbnkgPSB7fVxuICBjb25zdCBTU01fTk9UX0RFRklORUQgPSAnbm90LWRlZmluZWQnO1xuICBmb3IgKGNvbnN0IHBhcmFtIG9mIGNvbmZpZ1BhcmFtcy5wYXJhbWV0ZXJzKSB7XG4gICAgaWYgKHBhcmFtLmJvb2xlYW4pIHtcbiAgICAgIHBhcmFtc1twYXJhbS5uYW1lXSA9IChzc20uU3RyaW5nUGFyYW1ldGVyLnZhbHVlRnJvbUxvb2t1cChzY29wZSwgYCR7Y29uZmlnUGFyYW1zLmhpZXJhcmNoeX0ke3BhcmFtLm5hbWV9YCkudG9Mb3dlckNhc2UoKSA9PT0gXCJ0cnVlXCIpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHBhcmFtc1twYXJhbS5uYW1lXSA9IHNzbS5TdHJpbmdQYXJhbWV0ZXIudmFsdWVGcm9tTG9va3VwKHNjb3BlLCBgJHtjb25maWdQYXJhbXMuaGllcmFyY2h5fSR7cGFyYW0ubmFtZX1gKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHsgLi4ucGFyYW1zLCBTU01fTk9UX0RFRklORUQgfVxufVxuXG5leHBvcnQgY29uc3QgZml4RHVtbXlWYWx1ZVN0cmluZyA9ICh2YWx1ZTogc3RyaW5nKTogc3RyaW5nID0+IHtcbiAgaWYgKHZhbHVlLmluY2x1ZGVzKCdkdW1teS12YWx1ZS1mb3ItJykpIHJldHVybiB2YWx1ZS5yZXBsYWNlKC9cXC8vZywgJy0nKTtcbiAgZWxzZSByZXR1cm4gdmFsdWU7XG59Il19